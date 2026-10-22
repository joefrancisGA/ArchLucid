import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(VALUE_REPORT_HOW_IT_WORKS_OPEN_PARAM);
    } else {
      params.set(VALUE_REPORT_HOW_IT_WORKS_OPEN_PARAM, "1");
    }
    },
  });
}
