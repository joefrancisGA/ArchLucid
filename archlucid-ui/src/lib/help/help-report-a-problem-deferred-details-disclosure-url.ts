import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_REPORT_A_PROBLEM_DEFERRED_DETAILS_OPEN_PARAM = "helpReportAProblemDeferredDetailsOpen";

export function parseHelpReportAProblemDeferredDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpReportAProblemDeferredDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_REPORT_A_PROBLEM_DEFERRED_DETAILS_OPEN_PARAM);
}
