import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADVISORY_SCANS_HOW_IT_WORKS_OPEN_PARAM = "advisoryScansHowItWorksOpen";

export function parseAdvisoryScansHowItWorksOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisoryScansHowItWorksDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ADVISORY_SCANS_HOW_IT_WORKS_OPEN_PARAM);
}
