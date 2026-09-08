import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";

/** Query param highlighting the sealed child review row on the architecture desk (AO-35). */
export const FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM = "highlightReviewId" as const;

/** Working finalize success lands on the architecture desk with the sealed job highlighted. */
export function resolveFinalizeSuccessDeskHref(architectureId: string, reviewId: string): string {
  const params = new URLSearchParams({
    [FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM]: reviewId.trim(),
  });

  return `${architectureIdentityPath(architectureId.trim())}?${params.toString()}`;
}

export function parseFinalizeSuccessHighlightReviewId(
  searchParams: Pick<URLSearchParams, "get">,
): string | null {
  const reviewId = searchParams.get(FINALIZE_SUCCESS_HIGHLIGHT_REVIEW_QUERY_PARAM)?.trim() ?? "";

  if (reviewId.length === 0) {
    return null;
  }

  return reviewId;
}
