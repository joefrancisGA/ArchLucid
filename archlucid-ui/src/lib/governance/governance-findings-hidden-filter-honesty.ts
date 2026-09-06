import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  deriveFindingsHiddenFilterHonesty,
  type FindingsHiddenFilterHonesty,
} from "@/lib/findings/findings-hidden-filter-honesty";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function governanceFindingQueueRowKey(row: GovernanceFindingQueueRow): string {
  return `${row.runId}:${row.findingId}:${row.recordKind}`;
}

function toHiddenFilterFinding(row: GovernanceFindingQueueRow): QuickDecisionFinding {
  return {
    findingId: row.findingId,
    classification: row.classification ?? null,
    insightDensityScore: row.insightDensityScore ?? null,
  } as QuickDecisionFinding;
}

/** Working governance queue honesty — counts rows hidden by register, search, job view, or density filters. */
export function deriveGovernanceFindingsHiddenFilterHonesty(
  scopedRows: readonly GovernanceFindingQueueRow[],
  displayedRows: readonly GovernanceFindingQueueRow[],
): FindingsHiddenFilterHonesty {
  const displayedKeys = new Set(displayedRows.map((row) => governanceFindingQueueRowKey(row)));
  const hiddenRows = scopedRows.filter((row) => !displayedKeys.has(governanceFindingQueueRowKey(row)));

  return deriveFindingsHiddenFilterHonesty({
    toolbarFilteredCount: scopedRows.length,
    visibleCount: displayedRows.length,
    hiddenFindings: hiddenRows.map(toHiddenFilterFinding),
  });
}
