import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";

export const ASK_PAGE_THREAD_PARAM = "thread";
export const ASK_PAGE_COMPARE_PARAM = "compare";
export const ASK_PAGE_BASE_RUN_PARAM = "baseRunId";
export const ASK_PAGE_TARGET_RUN_PARAM = "targetRunId";

export type AskPageThreadUrlState = {
  readonly threadId: string;
  readonly compareOpen: boolean;
  readonly baseRunId?: string;
  readonly targetRunId?: string;
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

export function parseAskPageBaseRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAskPageTargetRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function askPageThreadHrefFromSearch(
  currentSearch: string,
  state: AskPageThreadUrlState,
  pathname: string = ASK_REVIEW_QUESTIONS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const threadId = state.threadId.trim();
  const baseRunId = (state.baseRunId ?? "").trim();
  const targetRunId = (state.targetRunId ?? "").trim();

  if (threadId.length === 0) {
    params.delete(ASK_PAGE_THREAD_PARAM);
    params.delete(ASK_PAGE_COMPARE_PARAM);
    params.delete(ASK_PAGE_BASE_RUN_PARAM);
    params.delete(ASK_PAGE_TARGET_RUN_PARAM);
  } else {
    params.set(ASK_PAGE_THREAD_PARAM, threadId);

    if (!state.compareOpen) {
      params.delete(ASK_PAGE_COMPARE_PARAM);
      params.delete(ASK_PAGE_BASE_RUN_PARAM);
      params.delete(ASK_PAGE_TARGET_RUN_PARAM);
    } else {
      params.set(ASK_PAGE_COMPARE_PARAM, "1");

      if (baseRunId.length === 0) {
        params.delete(ASK_PAGE_BASE_RUN_PARAM);
      } else {
        params.set(ASK_PAGE_BASE_RUN_PARAM, baseRunId);
      }

      if (targetRunId.length === 0) {
        params.delete(ASK_PAGE_TARGET_RUN_PARAM);
      } else {
        params.set(ASK_PAGE_TARGET_RUN_PARAM, targetRunId);
      }
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
