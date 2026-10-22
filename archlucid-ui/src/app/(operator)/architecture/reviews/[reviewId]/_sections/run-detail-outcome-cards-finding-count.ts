import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { resolveRunDetailDeferredSurfaceFindingCount } from "@/lib/runs/run-detail-findings-tab-badge-count";

/** Outcome cards must match tab badge and summary strip when explanation counts are still deferred. */
export function resolveRunDetailOutcomeCardsFindingCountDisplay(
  findingCountDisplay: number | null,
  quickDecisionFindings: readonly QuickDecisionFinding[],
): number | null {
  return resolveRunDetailDeferredSurfaceFindingCount(findingCountDisplay, quickDecisionFindings);
}
