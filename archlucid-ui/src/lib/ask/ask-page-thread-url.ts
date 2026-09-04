import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";

export const ASK_PAGE_THREAD_PARAM = "thread";
export const ASK_PAGE_COMPARE_PARAM = "compare";

export type AskPageThreadUrlState = {
  readonly threadId: string;
  readonly compareOpen: boolean;
};

export function parseAskPageThreadIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAskPageCompareOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function askPageThreadHrefFromSearch(
  currentSearch: string,
  state: AskPageThreadUrlState,
  pathname: string = ASK_REVIEW_QUESTIONS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const threadId = state.threadId.trim();

  if (threadId.length === 0) {
    params.delete(ASK_PAGE_THREAD_PARAM);
    params.delete(ASK_PAGE_COMPARE_PARAM);
  } else {
    params.set(ASK_PAGE_THREAD_PARAM, threadId);

    if (!state.compareOpen) {
      params.delete(ASK_PAGE_COMPARE_PARAM);
    } else {
      params.set(ASK_PAGE_COMPARE_PARAM, "1");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
