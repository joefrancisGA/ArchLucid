export const ROI_SUMMARY_METHODOLOGY_OPEN_PARAM = "roiSummaryMethodologyOpen";

export function parseRoiSummaryMethodologyOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function roiSummaryMethodologyDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ROI_SUMMARY_METHODOLOGY_OPEN_PARAM);
  } else {
    params.set(ROI_SUMMARY_METHODOLOGY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
