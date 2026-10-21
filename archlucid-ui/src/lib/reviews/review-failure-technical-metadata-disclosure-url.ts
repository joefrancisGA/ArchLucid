import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM = "reviewFailureTechnicalMetadataOpen";

export function parseReviewFailureTechnicalMetadataOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewFailureTechnicalMetadataDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM);
}
