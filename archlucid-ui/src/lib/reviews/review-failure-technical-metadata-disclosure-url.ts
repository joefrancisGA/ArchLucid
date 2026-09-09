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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM);
  } else {
    params.set(REVIEW_FAILURE_TECHNICAL_METADATA_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
