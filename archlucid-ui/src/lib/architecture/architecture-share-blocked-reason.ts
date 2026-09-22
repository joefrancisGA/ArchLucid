import type { ApiLoadFailureState } from "@/lib/api-load-failure";

export function architectureShareBlockedReason(failure: ApiLoadFailureState | null): string | null {
  if (failure === null) {
    return null;
  }

  if (failure.httpStatus === 404) {
    return "This architecture is not visible to you or share admin is not available.";
  }

  if (failure.httpStatus === 403) {
    return "You do not have permission to manage architecture shares.";
  }

  return null;
}
