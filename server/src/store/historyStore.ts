import { nanoid } from "nanoid";
import type { AnalyzeFailureRequest, FailureAnalysis } from "../schemas/index.js";
import { seedHistory } from "../data/sampleFailures.js";

export type FailureStatus = "Open" | "Investigating" | "Resolved";

export interface StoredFailure {
  id: string;
  createdAt: string;
  testInfo: AnalyzeFailureRequest["testInfo"];
  testDetails: AnalyzeFailureRequest["testDetails"];
  analysis: FailureAnalysis;
  status: FailureStatus;
  jiraKey?: string;
}

/**
 * Simple in-memory store, seeded with realistic sample history so the
 * dashboard, history table, release risk, and similarity detection all have
 * meaningful data from the moment the app starts (no DB required for MVP).
 */
class HistoryStore {
  private failures: StoredFailure[] = [...seedHistory];

  list(): StoredFailure[] {
    return [...this.failures].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  get(id: string): StoredFailure | undefined {
    return this.failures.find((f) => f.id === id);
  }

  add(entry: Omit<StoredFailure, "id" | "createdAt" | "status"> & { status?: FailureStatus }): StoredFailure {
    const record: StoredFailure = {
      id: nanoid(8),
      createdAt: new Date().toISOString(),
      status: entry.status ?? "Open",
      ...entry,
    };
    this.failures.unshift(record);
    return record;
  }

  updateStatus(id: string, status: FailureStatus): StoredFailure | undefined {
    const record = this.get(id);
    if (record) record.status = status;
    return record;
  }

  setJiraKey(id: string, jiraKey: string): StoredFailure | undefined {
    const record = this.get(id);
    if (record) record.jiraKey = jiraKey;
    return record;
  }
}

export const historyStore = new HistoryStore();
