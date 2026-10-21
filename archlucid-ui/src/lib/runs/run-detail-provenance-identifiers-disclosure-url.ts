import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM = "runDetailProvenanceIdentifiersOpen";

export function parseRunDetailProvenanceIdentifiersOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function runDetailProvenanceIdentifiersDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, RUN_DETAIL_PROVENANCE_IDENTIFIERS_OPEN_PARAM);
}
