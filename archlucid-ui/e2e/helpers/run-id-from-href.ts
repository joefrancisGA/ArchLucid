/** Extracts the run id segment from a canonical `/reviews/{runId}` href or URL (query/hash-safe). */
export function runIdFromReviewsHref(href: string): string {
  return href.split("/reviews/")[1]?.split(/[?#]/)[0] ?? "";
}
