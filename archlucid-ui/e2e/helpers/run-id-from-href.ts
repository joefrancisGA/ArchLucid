/** Extracts the run id segment from a canonical `/architecture/reviews/{runId}` href or URL (query/hash-safe). */
export function runIdFromReviewsHref(href: string): string {
  return href.split("/architecture/reviews/")[1]?.split(/[?#]/)[0] ?? "";
}

/** Extracts the manifest id segment from a canonical `/signed-records/{manifestId}` href (query/hash-safe). */
export function manifestIdFromSignedRecordHref(href: string): string {
  const segment = href.split("/signed-records/")[1]?.split(/[?#]/)[0] ?? "";

  return decodeURIComponent(segment);
}
