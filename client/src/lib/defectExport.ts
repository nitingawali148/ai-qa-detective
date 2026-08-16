import type { Defect } from "../types";

export function defectToMarkdown(defect: Defect): string {
  return `# ${defect.title}

## Description
${defect.description}

## Environment
${defect.environment}

## Preconditions
${defect.preconditions}

## Steps to Reproduce
${defect.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Expected Result
${defect.expected_result}

## Actual Result
${defect.actual_result}

## Root Cause
${defect.root_cause}

## Severity
${defect.severity}

## Priority
${defect.priority}

## Business Impact
${defect.business_impact}

## Evidence
${defect.evidence.map((e) => `- ${e}`).join("\n")}

## Suggested Fix
${defect.suggested_fix}

## Regression Recommendation
${defect.regression_recommendation}
`;
}

export function defectToPlainText(defect: Defect): string {
  return defectToMarkdown(defect).replace(/^#+\s*/gm, "").trim();
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
