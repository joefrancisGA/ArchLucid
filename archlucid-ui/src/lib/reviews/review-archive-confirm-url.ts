import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

export const REVIEW_ARCHIVE_RUN_ID_PARAM = "archiveRunId";
export const REVIEW_ARCHIVE_CONFIRM_PARAM = "archiveConfirm";

export type ReviewArchiveConfirmUrlState = {
  readonly runId: string | null;
  readonly confirmOpen: boolean;
};

export function parseReviewArchiveRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseReviewArchiveConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewArchiveConfirmHrefFromSearch(
  currentSearch: string,
  state: ReviewArchiveConfirmUrlState,
  pathname: string = REVIEWS_LIST_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const runId = (state.runId ?? "").trim();

  if (!state.confirmOpen || runId.length === 0) {
    params.delete(REVIEW_ARCHIVE_RUN_ID_PARAM);
    params.delete(REVIEW_ARCHIVE_CONFIRM_PARAM);
  } else {
    params.set(REVIEW_ARCHIVE_RUN_ID_PARAM, runId);
    params.set(REVIEW_ARCHIVE_CONFIRM_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
