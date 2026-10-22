import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const INFRA_DIAGRAMS_RESOURCE_ID_DISCLOSURE_OPEN_PARAM = "infraDiagramsResourceIdDisclosureOpen";

export function parseInfraDiagramsResourceIdDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function infraDiagramsResourceIdDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, INFRA_DIAGRAMS_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
}
