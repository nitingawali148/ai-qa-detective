import { useState } from "react";
import type { Defect, JiraCreateResult } from "../types";
import { Badge, priorityTone, severityTone } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { JiraCreateModal } from "./JiraCreateModal";
import { defectToMarkdown, defectToPlainText, downloadFile } from "../lib/defectExport";

export function DefectCard({ defect, onJiraCreated }: { defect: Defect; onJiraCreated?: (result: JiraCreateResult) => void }) {
  const [copied, setCopied] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(defectToPlainText(defect));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Jira-Ready Defect</p>
          <CardTitle className="text-base">{defect.title}</CardTitle>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Badge tone={severityTone(defect.severity)}>{defect.severity}</Badge>
          <Badge tone={priorityTone(defect.priority)}>{defect.priority}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Section title="Description" text={defect.description} />
        <div className="grid grid-cols-2 gap-4">
          <Section title="Environment" text={defect.environment} />
          <Section title="Preconditions" text={defect.preconditions} />
        </div>
        <Section title="Steps to Reproduce" list={defect.steps_to_reproduce} />
        <div className="grid grid-cols-2 gap-4">
          <Section title="Expected Result" text={defect.expected_result} />
          <Section title="Actual Result" text={defect.actual_result} />
        </div>
        <Section title="Root Cause" text={defect.root_cause} />
        <Section title="Business Impact" text={defect.business_impact} />
        <Section title="Evidence" list={defect.evidence} />
        <Section title="Suggested Fix" text={defect.suggested_fix} />
        <Section title="Regression Recommendation" text={defect.regression_recommendation} />

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? "Copied ✓" : "Copy Defect"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile(`${slug(defect.title)}.md`, defectToMarkdown(defect), "text/markdown")}>
            Download Defect
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile(`${slug(defect.title)}.json`, JSON.stringify(defect, null, 2), "application/json")}>
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile(`${slug(defect.title)}.md`, defectToMarkdown(defect), "text/markdown")}>
            Export Markdown
          </Button>
          <Button size="sm" className="ml-auto" onClick={() => setShowJiraModal(true)}>
            Create Jira Defect
          </Button>
        </div>
      </CardContent>

      {showJiraModal && (
        <JiraCreateModal defect={defect} onClose={() => setShowJiraModal(false)} onCreated={onJiraCreated} />
      )}
    </Card>
  );
}

function Section({ title, text, list }: { title: string; text?: string; list?: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{title}</p>
      {list ? (
        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-200 space-y-0.5">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{text}</p>
      )}
    </div>
  );
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "defect";
}
