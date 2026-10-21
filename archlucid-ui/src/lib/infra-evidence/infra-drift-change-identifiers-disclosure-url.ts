import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const INFRA_DRIFT_CHANGE_IDENTIFIERS_OPEN_PARAM = "infraDriftChangeIdentifiersOpen";

export function parseInfraDriftChangeIdentifiersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraDriftChangeIdentifiersDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, INFRA_DRIFT_CHANGE_IDENTIFIERS_OPEN_PARAM);
}
