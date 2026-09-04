export const REVIEW_ASK_DOCK_OPEN_PARAM = "askDock";
export const REVIEW_ASK_DOCK_THREAD_PARAM = "askThread";

export type ReviewAskDockUrlState = {
  readonly open: boolean;
  readonly threadId: string | null;
};

export function parseReviewAskDockOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseReviewAskDockThreadIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function reviewAskDockHrefFromSearch(
  currentSearch: string,
  state: ReviewAskDockUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const threadId = (state.threadId ?? "").trim();

  if (!state.open) {
    params.delete(REVIEW_ASK_DOCK_OPEN_PARAM);
    params.delete(REVIEW_ASK_DOCK_THREAD_PARAM);
  } else {
    params.set(REVIEW_ASK_DOCK_OPEN_PARAM, "1");

    if (threadId.length === 0) {
      params.delete(REVIEW_ASK_DOCK_THREAD_PARAM);
    } else {
      params.set(REVIEW_ASK_DOCK_THREAD_PARAM, threadId);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
