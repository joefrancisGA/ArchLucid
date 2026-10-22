import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADVISORY_SAMPLE_DISPOSITION_OPEN_PARAM = "advisorySampleDispositionOpen";

export function parseAdvisorySampleDispositionOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function advisorySampleDispositionDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ADVISORY_SAMPLE_DISPOSITION_OPEN_PARAM);
}
