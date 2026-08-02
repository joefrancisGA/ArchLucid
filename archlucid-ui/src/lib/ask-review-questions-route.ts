/** Canonical Ask review questions (left-nav label); formerly `/ask`. */
export const ASK_REVIEW_QUESTIONS_PATH = "/insights/ask-review-questions" as const;

/** Legacy bookmark path — `next.config` permanent redirect to {@link ASK_REVIEW_QUESTIONS_PATH}. */
export const LEGACY_ASK_PATH = "/ask" as const;

export function isAskReviewQuestionsPath(pathname: string): boolean {
  return (
    pathname === ASK_REVIEW_QUESTIONS_PATH || pathname.startsWith(`${ASK_REVIEW_QUESTIONS_PATH}/`)
  );
}

/** Builds Ask review questions href with optional query (e.g. `runId`). */
export function askReviewQuestionsHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return ASK_REVIEW_QUESTIONS_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${ASK_REVIEW_QUESTIONS_PATH}?${qs}` : ASK_REVIEW_QUESTIONS_PATH;
}
