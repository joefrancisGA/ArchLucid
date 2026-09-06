import type { ApiLoadFailureState } from "@/lib/api-load-failure";

/** Wave-38 suggestion 449: surface lifecycle/sealed-hash compare 409 copy instead of generic load failure. */
export function compareRunPairBlockedReason(failure: ApiLoadFailureState | null): string | null {
  if (failure === null || failure.httpStatus !== 409) {
    return null;
  }

  const detail = failure.problem?.detail?.trim() ?? failure.message.trim();

  if (detail.length > 0) {
    return detail;
  }

  return "Compare blocked: one or both reviews must have a complete authority lifecycle and verified sealed manifest before comparison.";
}
