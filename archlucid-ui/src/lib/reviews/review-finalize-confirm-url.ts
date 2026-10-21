import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_FINALIZE_CONFIRM_PARAM = "finalizeConfirm";
export const REVIEW_FINALIZE_SUCCESS_PARAM = "finalizeSuccess";

export type ReviewFinalizeConfirmUrlState = {
  readonly confirmOpen: boolean;
  readonly successOpen: boolean;
};

export function parseReviewFinalizeConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReviewFinalizeSuccessOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewFinalizeConfirmHrefFromSearch(
  currentSearch: string,
  state: ReviewFinalizeConfirmUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!state.confirmOpen) {
      params.delete(REVIEW_FINALIZE_CONFIRM_PARAM);
    } else {
      params.set(REVIEW_FINALIZE_CONFIRM_PARAM, "1");
    }

    if (!state.successOpen) {
      params.delete(REVIEW_FINALIZE_SUCCESS_PARAM);
    } else {
      params.set(REVIEW_FINALIZE_SUCCESS_PARAM, "1");
    }
    },
  });
}
