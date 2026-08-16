import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AnalyzeResponse, Defect, EvidenceInput, RegressionTest, TestDetails, TestInfo } from "../types";

/**
 * Holds the "currently analyzed failure" so the Analyze Failure results,
 * Test Generator, Jira Defects, and Chat Assistant all stay in sync without
 * prop-drilling across routes.
 */
interface AnalysisState {
  testInfo: TestInfo | null;
  testDetails: TestDetails | null;
  evidence: EvidenceInput | null;
  result: AnalyzeResponse | null;
  defect: Defect | null;
  tests: RegressionTest[] | null;
  setInvestigation: (v: { testInfo: TestInfo; testDetails: TestDetails; evidence: EvidenceInput }) => void;
  setResult: (r: AnalyzeResponse | null) => void;
  setDefect: (d: Defect | null) => void;
  setTests: (t: RegressionTest[] | null) => void;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisState | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [evidence, setEvidence] = useState<EvidenceInput | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [defect, setDefect] = useState<Defect | null>(null);
  const [tests, setTests] = useState<RegressionTest[] | null>(null);

  const value = useMemo<AnalysisState>(
    () => ({
      testInfo,
      testDetails,
      evidence,
      result,
      defect,
      tests,
      setInvestigation: (v) => {
        setTestInfo(v.testInfo);
        setTestDetails(v.testDetails);
        setEvidence(v.evidence);
      },
      setResult: (r) => {
        setResult(r);
        setDefect(null);
        setTests(null);
      },
      setDefect,
      setTests,
      reset: () => {
        setTestInfo(null);
        setTestDetails(null);
        setEvidence(null);
        setResult(null);
        setDefect(null);
        setTests(null);
      },
    }),
    [testInfo, testDetails, evidence, result, defect, tests]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
