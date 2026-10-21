import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ROI_SUMMARY_METHODOLOGY_OPEN_PARAM);
}
