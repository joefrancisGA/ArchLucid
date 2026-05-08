import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { runSummaryDisplayLabel } from "@/lib/run-summary-display-label";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";

/**
 * Friendly headings for Compare UI — prefers API `displayName` when `pickedSummary` matches `runId`
 * (picker selection); otherwise demo slug labels; otherwise raw id.
 */
export function compareRunHeadingLabel(runId: string, pickedSummary?: RunSummary | null): string {
  const trimmed = runId.trim();

  if (pickedSummary !== undefined && pickedSummary !== null) {
    const pickedId = pickedSummary.runId.trim();

    if (
      canonicalizeDemoRunId(pickedId).toLowerCase() === canonicalizeDemoRunId(trimmed).toLowerCase()
    ) {
      return runSummaryDisplayLabel(pickedSummary);
    }
  }

  const buyer = compareRunBuyerDisplayLabel(trimmed);

  if (buyer !== null) {
    return buyer;
  }

  if (trimmed === SHOWCASE_STATIC_DEMO_RUN_ID) {
    return "Claims Intake (completed review)";
  }

  return trimmed;
}
