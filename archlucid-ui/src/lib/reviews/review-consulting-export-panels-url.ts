export const REVIEW_CONSULTING_EXPORT_OPEN_PARAM = "consultingExportOpen";

export function parseReviewConsultingExportOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function reviewConsultingExportPanelsHrefFromSearch(
  currentSearch: string,
  exportOpen: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!exportOpen) {
    params.delete(REVIEW_CONSULTING_EXPORT_OPEN_PARAM);
  } else {
    params.set(REVIEW_CONSULTING_EXPORT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
