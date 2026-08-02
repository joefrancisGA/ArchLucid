/** Canonical Ask review questions (left-nav label); formerly `/ask` (retired — no redirect). */
export const ASK_REVIEW_QUESTIONS_PATH = "/insights/ask-review-questions" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
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
