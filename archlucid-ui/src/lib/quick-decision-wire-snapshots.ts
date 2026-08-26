import type { RunDetail } from "@/types/authority";
import type { FindingTraceConfidenceDto, RunExplanationSummary } from "@/types/explanation";

import {
  extractQuickDecisionFindingsFromRunDetail,
  resolveQuickDecisionFindingsForRunDetail,
} from "@/lib/quick-decision-finding-extract";

/**
 * Persisted architecture finding wire snapshot for "AI reasoning" deep-dive UI.
 * Extends automatically when the API adds Staged Critic / evaluation fields — payload is full JSON.
 */
export type FindingWireSnapshot = {
  /** Pretty-printed `ArchitectureFinding` (or superset) as returned on the run detail wire. */
  wireJson: string;
  reasoningTrace: string;
};

/** Resolves finding trace rows from aggregate explanation payloads (top-level or nested). */
export function resolveFindingTraceRowsFromSummary(
  summary: RunExplanationSummary | null,
): FindingTraceConfidenceDto[] {
  if (summary === null) {
    return [];
  }

  const top = summary.findingTraceConfidences;
  const nested = summary.explanation?.findingTraceConfidences;

  if (Array.isArray(top) && top.length > 0) {
    return top;
  }

  if (Array.isArray(nested) && nested.length > 0) {
    return nested;
  }

  return [];
}

/** Map of finding id → wire snapshot for any row that lists findings (e.g. explainability table). */
export function buildFindingWireSnapshotsByFindingId(detail: RunDetail): Record<string, FindingWireSnapshot> {
  const extracted = extractQuickDecisionFindingsFromRunDetail(detail);
  const record: Record<string, FindingWireSnapshot> = {};

  for (const row of extracted) {
    record[row.findingId] = row.aiReasoning;
  }

  return record;
}

/** Wire snapshots from run detail findings, extended when quick-decision rows are synthesized from explanation traces. */
export function buildFindingWireSnapshotsForRunDetail(
  detail: RunDetail,
  explanationSummary: RunExplanationSummary | null,
): Record<string, FindingWireSnapshot> {
  const record = buildFindingWireSnapshotsByFindingId(detail);
  const resolved = resolveQuickDecisionFindingsForRunDetail(detail, explanationSummary);

  for (const row of resolved) {
    if (record[row.findingId] === undefined) {
      record[row.findingId] = row.aiReasoning;
    }
  }

  return record;
}
