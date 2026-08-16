import type { StoredFailure } from "../store/historyStore.js";
import type { FailureAnalysis } from "../schemas/index.js";

/**
 * Lightweight lexical similarity for "Similar Failure Detection" (Section 16).
 * This is a simplified keyword/token-overlap comparison, NOT a trained
 * embedding model — the UI is explicit about that so the product never
 * overclaims what technique is actually running under the hood.
 */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "was", "were", "be", "been", "to", "of", "in", "on",
  "for", "with", "that", "this", "it", "as", "at", "by", "from", "because", "not", "did", "does",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function signature(analysis: Pick<FailureAnalysis, "root_cause" | "root_cause_category" | "failure_summary">): string {
  return `${analysis.root_cause_category} ${analysis.root_cause} ${analysis.failure_summary}`;
}

export interface SimilarFailureResult {
  matchId: string;
  matchLabel: string;
  similarityPercent: number;
  previouslyObserved: number;
  lastOccurrence: string;
}

/**
 * Combines exact category match with token overlap into one 0-1 score.
 * Token overlap is square-rooted before weighting: short root-cause
 * sentences naturally produce low raw Jaccard scores even when they
 * describe the same underlying failure, so this keeps genuinely related
 * failures from being under-scored without inventing similarity that isn't there.
 */
function similarityScore(
  a: Pick<FailureAnalysis, "root_cause" | "root_cause_category" | "failure_summary">,
  b: Pick<FailureAnalysis, "root_cause" | "root_cause_category" | "failure_summary">
): number {
  const categoryMatch = a.root_cause_category === b.root_cause_category ? 1 : 0;
  const tokenOverlap = jaccard(tokenize(signature(a)), tokenize(signature(b)));
  return categoryMatch * (0.3 + 0.7 * Math.sqrt(tokenOverlap));
}

export function findSimilarFailure(
  current: Pick<FailureAnalysis, "root_cause" | "root_cause_category" | "failure_summary">,
  history: StoredFailure[],
  threshold = 0.55
): SimilarFailureResult | null {
  if (history.length === 0) return null;

  const scored = history
    .map((f) => ({ failure: f, score: similarityScore(current, f.analysis) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < threshold) return null;

  // Count how many other historical records also belong to this same "family"
  // of failure (i.e. how many times it has previously occurred).
  const related = scored.filter((s) => similarityScore(best.failure.analysis, s.failure.analysis) >= threshold);
  const lastOccurrence = related.reduce((latest, r) => (r.failure.createdAt > latest ? r.failure.createdAt : latest), related[0].failure.createdAt);

  return {
    matchId: best.failure.id,
    matchLabel: best.failure.analysis.failure_summary,
    similarityPercent: Math.min(99, Math.round(best.score * 100)),
    previouslyObserved: related.length,
    lastOccurrence,
  };
}
