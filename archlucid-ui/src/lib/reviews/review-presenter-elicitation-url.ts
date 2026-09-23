export const REVIEW_PRESENTER_QUESTION_ID_PARAM = "presenterQuestionId";

export function parseReviewPresenterQuestionIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

/** Reads presenter question id from the live address bar (not stale Next.js `useSearchParams`). */
export function readReviewPresenterQuestionIdFromWindowLocation(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return parseReviewPresenterQuestionIdFromSearch(
    new URLSearchParams(window.location.search).get(REVIEW_PRESENTER_QUESTION_ID_PARAM),
  );
}

export function reviewPresenterElicitationHrefFromSearch(
  currentSearch: string,
  questionId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (questionId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(REVIEW_PRESENTER_QUESTION_ID_PARAM);
  } else {
    params.set(REVIEW_PRESENTER_QUESTION_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
