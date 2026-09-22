import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { resolveComparePickerFootnote } from "@/lib/system-not-job-compare-labeled-envelope-runs";
import type { RunSummary } from "@/types/authority";

export type ComparedPair = { left: string; right: string };

/** Secondary hint under Compare pickers — door stamp plus title when the row was picked from the list (SN-014 / CG-057). */
export function comparePickerFootnote(runId: string, picked: RunSummary | null): string | null {
  return resolveComparePickerFootnote(runId, picked);
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

  return " — ";
}
