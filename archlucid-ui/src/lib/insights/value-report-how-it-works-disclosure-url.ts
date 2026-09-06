import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

export const VALUE_REPORT_HOW_IT_WORKS_OPEN_PARAM = "valueReportHowItWorksOpen";

export function parseValueReportHowItWorksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function valueReportHowItWorksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = SPONSOR_REPORT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(VALUE_REPORT_HOW_IT_WORKS_OPEN_PARAM);
  } else {
    params.set(VALUE_REPORT_HOW_IT_WORKS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
