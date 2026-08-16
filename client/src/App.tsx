import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { AnalyzeFailure } from "./pages/AnalyzeFailure";
import { FailureHistory } from "./pages/FailureHistory";
import { TestGenerator } from "./pages/TestGenerator";
import { ReleaseRiskPage } from "./pages/ReleaseRisk";
import { JiraDefects } from "./pages/JiraDefects";
import { Settings } from "./pages/Settings";
import { PresentationMode } from "./pages/PresentationMode";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/analyze" element={<AnalyzeFailure />} />
      <Route path="/history" element={<FailureHistory />} />
      <Route path="/tests" element={<TestGenerator />} />
      <Route path="/risk" element={<ReleaseRiskPage />} />
      <Route path="/jira" element={<JiraDefects />} />
      <Route path="/present" element={<PresentationMode />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}
