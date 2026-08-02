import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { compareRunBuyerDisplayLabel } from "@/lib/compare-run-display-label";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { runSummaryDisplayLabel } from "@/lib/run-summary-display-label";
import type { RunSummary } from "@/types/authority";

export type ComparedPair = { left: string; right: string };

/** Secondary hint under Compare pickers — demo slugs or API-backed label when the row was picked from the list. */
export function comparePickerFootnote(runId: string, picked: RunSummary | null): string | null {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const demoLabel = compareRunBuyerDisplayLabel(trimmed);

  if (demoLabel !== null) {
    return demoLabel;
  }

  if (picked !== null) {
    const pickedId = picked.runId.trim();

    if (canonicalizeDemoRunId(pickedId).toLowerCase() === canonicalizeDemoRunId(trimmed).toLowerCase()) {
      const label = runSummaryDisplayLabel(picked);

      if (label.toLowerCase() !== trimmed.toLowerCase()) {
        return label;
      }
    }
  }

  return null;
}

export function outcomeLabel(params: {
  hasValue: boolean;
  failure: ApiLoadFailureState | null;
  malformed: string | null;
}): string {
  if (params.failure !== null) {
    return "Request failed";
  }

  if (params.malformed !== null) {
    return "Response not usable (shape)";
  }

  if (params.hasValue) {
    return "OK";
  }

  return "—";
}
