export const ARTIFACT_REVIEW_RAW_CONTENT_OPEN_PARAM = "artifactReviewRawContentOpen";

export function parseArtifactReviewRawContentOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function artifactReviewRawContentDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ARTIFACT_REVIEW_RAW_CONTENT_OPEN_PARAM);
  } else {
    params.set(ARTIFACT_REVIEW_RAW_CONTENT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
