import { llmProvider } from "./llm-provider.js";
import { getStructuredCompletion } from "./structured-response.js";
import {
  TestGenerationSchema,
  type GenerateTestsRequest,
  type RegressionTest,
  type TestGeneration,
} from "../schemas/index.js";
import { TEST_GENERATOR_SYSTEM, PLAYWRIGHT_GENERATOR_SYSTEM, buildTestGenerationPrompt, buildPlaywrightPrompt } from "./prompts.js";

function buildMockTests(req: GenerateTestsRequest): TestGeneration {
  const { analysis, testInfo } = req;
  const testNameNoVerify = testInfo.testName.replace(/^verify\s+/i, "");
  const base: Omit<RegressionTest, "id">[] = [
    {
      scenario: `Verify ${testNameNoVerify} succeeds under normal conditions`,
      preconditions: "Application and all dependent services are healthy.",
      steps: ["Perform the original test steps with valid data.", "Confirm the expected result is produced."],
      expected_result: req.testDetails.expectedResult,
      priority: "P2",
      automation_recommendation: "Automate as a smoke test in the primary regression suite.",
    },
    {
      scenario: `Verify behavior when the root cause condition recurs: ${analysis.root_cause}`,
      preconditions: "Ability to simulate the failure condition identified in the root cause analysis.",
      steps: ["Reproduce the exact condition described in the root cause.", "Confirm the application handles it gracefully instead of failing."],
      expected_result: "The application handles the condition gracefully (clear error, no crash/500).",
      priority: analysis.priority,
      automation_recommendation: "Automate at the API/unit level for fast, reliable feedback.",
    },
    {
      scenario: "Verify the UI/API surfaces a meaningful error message on failure",
      preconditions: "Ability to force the failure condition.",
      steps: ["Trigger the failure condition.", "Inspect the message returned to the user or caller."],
      expected_result: "A clear, actionable error message is shown/returned; no raw stack trace or generic 500 is exposed.",
      priority: "P2",
      automation_recommendation: "Automate as part of negative-path UI/API coverage.",
    },
    {
      scenario: "Verify retry/recovery behavior after the failure condition clears",
      preconditions: "Failure condition can be toggled off after being triggered.",
      steps: ["Trigger the failure condition.", "Clear the condition.", "Retry the original action."],
      expected_result: "The action succeeds once the underlying condition is resolved.",
      priority: "P3",
      automation_recommendation: "Automate as an integration test if retry logic exists; otherwise track as manual coverage.",
    },
    {
      scenario: `Regression check: ${analysis.root_cause_category} does not reoccur across related flows`,
      preconditions: "Related flows sharing the same component/service are identified.",
      steps: ["Identify other flows that depend on the same component/service.", "Execute each flow and confirm no similar failure occurs."],
      expected_result: "No related flow exhibits the same failure signature.",
      priority: "P3",
      automation_recommendation: "Add to the broader regression suite once the primary fix is verified.",
    },
  ];

  return {
    tests: base.map((t, i) => ({ id: `TC-${String(i + 1).padStart(3, "0")}`, ...t })),
  };
}

export async function generateRegressionTests(req: GenerateTestsRequest): Promise<TestGeneration> {
  if (llmProvider.name === "mock") {
    return buildMockTests(req);
  }

  return getStructuredCompletion<TestGeneration>({
    system: TEST_GENERATOR_SYSTEM,
    prompt: buildTestGenerationPrompt(req),
    schema: TestGenerationSchema,
    maxTokens: 2500,
  });
}

function buildMockPlaywrightTest(testInfo: any, test: RegressionTest): string {
  const stepsComments = test.steps.map((s, i) => `  // Step ${i + 1}: ${s}`).join("\n");
  return `import { test, expect } from '@playwright/test';

// Application: ${testInfo.application}
// Scenario: ${test.scenario}
// NOTE: Selectors below are placeholders (data-testid convention).
// Replace them with real selectors from the application before running.

test('${test.scenario.replace(/'/g, "\\'")}', async ({ page }) => {
${stepsComments}

  await page.goto('/'); // TODO: set the correct starting URL

  // TODO: implement the steps above using real selectors, e.g.:
  // await page.getByTestId('example-element').click();

  // Expected result: ${test.expected_result}
  // TODO: replace with a real assertion once selectors are wired up
  await expect(page).toHaveURL(/.*/);
});
`;
}

export async function generatePlaywrightTest(testInfo: any, test: RegressionTest): Promise<{ code: string; isMock: boolean }> {
  if (llmProvider.name === "mock") {
    return { code: buildMockPlaywrightTest(testInfo, test), isMock: true };
  }

  const result = await llmProvider.complete({
    system: PLAYWRIGHT_GENERATOR_SYSTEM,
    prompt: buildPlaywrightPrompt(testInfo, test),
    maxTokens: 1500,
  });
  return { code: result.text.trim(), isMock: false };
}
