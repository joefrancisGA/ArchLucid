import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ARTIFACT_REVIEW_RAW_CONTENT_OPEN_PARAM);
}
