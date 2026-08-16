import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { FieldGroup, Input, Textarea } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { AnalysisAnimation } from "../components/AnalysisAnimation";
import { ResultsPanel } from "../components/ResultsPanel";
import { DefectCard } from "../components/DefectCard";
import { RegressionTestsList } from "../components/RegressionTestsList";
import { useAnalysis } from "../context/AnalysisContext";
import { api, ApiError } from "../api/client";
import { fileToBase64 } from "../lib/fileToBase64";
import type { EvidenceInput, TestDetails, TestInfo } from "../types";

const EMPTY_TEST_INFO: TestInfo = {
  testName: "",
  testId: "",
  application: "",
  environment: "",
  browser: "",
  buildVersion: "",
  executionTime: "",
};

const EMPTY_TEST_DETAILS: TestDetails = { description: "", steps: "", expectedResult: "", actualResult: "" };
const EMPTY_EVIDENCE: EvidenceInput = { logs: "", stackTrace: "", apiResponse: "", consoleLogs: "" };

type EvidenceTab = "logs" | "stackTrace" | "apiResponse" | "consoleLogs" | "screenshot";

export function AnalyzeFailure() {
  const { result, testInfo: ctxTestInfo, testDetails: ctxTestDetails, evidence: ctxEvidence, defect, tests, setInvestigation, setResult, setDefect, setTests } =
    useAnalysis();

  const [testInfo, setTestInfo] = useState<TestInfo>(ctxTestInfo ?? EMPTY_TEST_INFO);
  const [testDetails, setTestDetails] = useState<TestDetails>(ctxTestDetails ?? EMPTY_TEST_DETAILS);
  const [evidence, setEvidence] = useState<EvidenceInput>(ctxEvidence ?? EMPTY_EVIDENCE);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EvidenceTab>("logs");

  const [analyzing, setAnalyzing] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scenarios, setScenarios] = useState<{ key: string; label: string; application: string; scenario: any }[] | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const [generatingDefect, setGeneratingDefect] = useState(false);
  const [defectError, setDefectError] = useState<string | null>(null);
  const [generatingTests, setGeneratingTests] = useState(false);
  const [testsError, setTestsError] = useState<string | null>(null);

  const loadDemo = async () => {
    setLoadingDemo(true);
    setError(null);
    try {
      const res = await api.loadDemo();
      setTestInfo(res.scenario.testInfo);
      setTestDetails(res.scenario.testDetails);
      setEvidence(res.scenario.evidence);
      setScreenshotName(null);
      setResult(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load demo scenario.");
    } finally {
      setLoadingDemo(false);
    }
  };

  const toggleScenarioPicker = async () => {
    if (scenarios) {
      setScenarios(null);
      return;
    }
    try {
      const res = await api.loadScenarios();
      setScenarios(res.scenarios);
    } catch {
      setError("Failed to load sample scenarios.");
    }
  };

  const applyScenario = (scenario: any) => {
    setTestInfo(scenario.testInfo);
    setTestDetails(scenario.testDetails);
    setEvidence(scenario.evidence);
    setScreenshotName(null);
    setResult(null);
    setScenarios(null);
  };

  const handleScreenshotUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const { base64, mimeType } = await fileToBase64(file);
      setEvidence((e) => ({ ...e, screenshotBase64: base64, screenshotMimeType: mimeType }));
      setScreenshotName(file.name);
    } catch {
      setError("Failed to read the uploaded screenshot.");
    }
  };

  const analyze = async () => {
    setError(null);
    if (!testInfo.testName || !testInfo.application || !testDetails.expectedResult || !testDetails.actualResult) {
      setError("Please fill in Test Name, Application, Expected Result, and Actual Result before analyzing.");
      return;
    }
    setAnalyzing(true);
    setAnimationDone(false);
    setResult(null);
    setInvestigation({ testInfo, testDetails, evidence });
    try {
      const res = await api.analyze({ testInfo, testDetails, evidence });
      setAnimationDone(true);
      setTimeout(() => {
        setResult(res);
        setAnalyzing(false);
      }, 900);
    } catch (err) {
      setAnalyzing(false);
      setError(err instanceof ApiError ? err.message : "AI analysis could not be completed. Please verify the configured AI provider and try again.");
    }
  };

  const generateDefect = async () => {
    if (!result) return;
    setGeneratingDefect(true);
    setDefectError(null);
    try {
      const res = await api.generateDefect({ testInfo, testDetails, evidence, analysis: result.analysis, failureId: result.failureId });
      setDefect(res.defect);
    } catch (err) {
      setDefectError(err instanceof ApiError ? err.message : "Defect generation failed. Please try again.");
    } finally {
      setGeneratingDefect(false);
    }
  };

  const generateTests = async () => {
    if (!result) return;
    setGeneratingTests(true);
    setTestsError(null);
    try {
      const res = await api.generateTests({ testInfo, testDetails, analysis: result.analysis });
      setTests(res.tests);
    } catch (err) {
      setTestsError(err instanceof ApiError ? err.message : "Regression test generation failed. Please try again.");
    } finally {
      setGeneratingTests(false);
    }
  };

  return (
    <AppShell title="Analyze Failure" subtitle="Submit test evidence and let AI QA Detective investigate the root cause">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Test Information</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={toggleScenarioPicker}>
                  Load Sample ▾
                </Button>
                <Button size="sm" onClick={loadDemo} disabled={loadingDemo}>
                  {loadingDemo ? "Loading…" : "Load Demo Failure"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scenarios && (
                <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {scenarios.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => applyScenario(s.scenario)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-700 dark:text-slate-200">{s.label}</span>
                      <span className="text-xs text-slate-400">{s.application}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Test Name">
                  <Input value={testInfo.testName} onChange={(e) => setTestInfo({ ...testInfo, testName: e.target.value })} placeholder="Verify checkout using credit card" />
                </FieldGroup>
                <FieldGroup label="Test ID">
                  <Input value={testInfo.testId} onChange={(e) => setTestInfo({ ...testInfo, testId: e.target.value })} placeholder="TC-CHECKOUT-014" />
                </FieldGroup>
                <FieldGroup label="Application">
                  <Input value={testInfo.application} onChange={(e) => setTestInfo({ ...testInfo, application: e.target.value })} placeholder="ShopSphere E-Commerce" />
                </FieldGroup>
                <FieldGroup label="Environment">
                  <Input value={testInfo.environment} onChange={(e) => setTestInfo({ ...testInfo, environment: e.target.value })} placeholder="QA" />
                </FieldGroup>
                <FieldGroup label="Browser">
                  <Input value={testInfo.browser} onChange={(e) => setTestInfo({ ...testInfo, browser: e.target.value })} placeholder="Chrome" />
                </FieldGroup>
                <FieldGroup label="Build Version">
                  <Input value={testInfo.buildVersion} onChange={(e) => setTestInfo({ ...testInfo, buildVersion: e.target.value })} placeholder="2026.08.16.142" />
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FieldGroup label="Description">
                <Textarea className="font-sans" value={testDetails.description} onChange={(e) => setTestDetails({ ...testDetails, description: e.target.value })} rows={2} />
              </FieldGroup>
              <FieldGroup label="Test Steps">
                <Textarea value={testDetails.steps} onChange={(e) => setTestDetails({ ...testDetails, steps: e.target.value })} rows={3} />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Expected Result">
                  <Textarea className="font-sans" value={testDetails.expectedResult} onChange={(e) => setTestDetails({ ...testDetails, expectedResult: e.target.value })} rows={2} />
                </FieldGroup>
                <FieldGroup label="Actual Result">
                  <Textarea className="font-sans" value={testDetails.actualResult} onChange={(e) => setTestDetails({ ...testDetails, actualResult: e.target.value })} rows={2} />
                </FieldGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Failure Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 mb-3 border-b border-slate-100 dark:border-slate-800">
                {(["logs", "stackTrace", "apiResponse", "consoleLogs", "screenshot"] as EvidenceTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? "border-brand-600 text-brand-600 dark:text-brand-400"
                        : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab === "apiResponse" ? "API Response" : tab === "consoleLogs" ? "Console Logs" : tab === "stackTrace" ? "Stack Trace" : tab === "screenshot" ? "Screenshot" : "Logs"}
                  </button>
                ))}
              </div>

              {activeTab === "logs" && <Textarea rows={7} value={evidence.logs} onChange={(e) => setEvidence({ ...evidence, logs: e.target.value })} placeholder="Paste execution logs…" />}
              {activeTab === "stackTrace" && (
                <Textarea rows={7} value={evidence.stackTrace} onChange={(e) => setEvidence({ ...evidence, stackTrace: e.target.value })} placeholder="Paste stack trace…" />
              )}
              {activeTab === "apiResponse" && (
                <Textarea rows={7} value={evidence.apiResponse} onChange={(e) => setEvidence({ ...evidence, apiResponse: e.target.value })} placeholder="Paste API request/response…" />
              )}
              {activeTab === "consoleLogs" && (
                <Textarea rows={7} value={evidence.consoleLogs} onChange={(e) => setEvidence({ ...evidence, consoleLogs: e.target.value })} placeholder="Paste browser console logs…" />
              )}
              {activeTab === "screenshot" && (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" id="screenshot-upload" className="hidden" onChange={(e) => handleScreenshotUpload(e.target.files?.[0])} />
                  <label htmlFor="screenshot-upload" className="cursor-pointer text-sm text-brand-600 font-medium hover:underline">
                    Upload a screenshot
                  </label>
                  {screenshotName && <p className="text-xs text-slate-500 mt-2">Attached: {screenshotName}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">Analyzed with multimodal AI when a vision-capable provider is configured.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Card className="p-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">{error}</Card>
          )}

          <Button size="lg" className="w-full" onClick={analyze} disabled={analyzing}>
            {analyzing ? "Analyzing…" : "🔍 Analyze with AI"}
          </Button>
        </div>

        {/* RIGHT: Results */}
        <div className="space-y-6">
          {analyzing && <AnalysisAnimation done={animationDone} />}

          {!analyzing && !result && (
            <Card className="p-10 text-center">
              <p className="text-4xl mb-3">🕵️</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No investigation yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Fill in the test details and evidence on the left, or click "Load Demo Failure" for an instant example, then click Analyze with AI.
              </p>
            </Card>
          )}

          {!analyzing && result && (
            <>
              <ResultsPanel response={result} hasScreenshot={!!evidence.screenshotBase64} />

              <Card className="p-5">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={generateDefect} disabled={generatingDefect}>
                    {generatingDefect ? "Generating…" : "🐞 Generate Defect"}
                  </Button>
                  <Button variant="outline" onClick={generateTests} disabled={generatingTests}>
                    {generatingTests ? "Generating…" : "🧪 Generate Regression Tests"}
                  </Button>
                </div>
                {defectError && <p className="text-xs text-red-500 mt-2">{defectError}</p>}
                {testsError && <p className="text-xs text-red-500 mt-2">{testsError}</p>}
              </Card>

              {defect && <DefectCard defect={defect} />}
              {tests && <RegressionTestsList tests={tests} testInfo={testInfo} />}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
