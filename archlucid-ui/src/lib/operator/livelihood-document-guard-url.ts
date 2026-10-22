import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM = "navGuardOpen";

export function parseLivelihoodDocumentGuardOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function livelihoodDocumentGuardHrefFromSearch(
  currentSearch: string,
  guardOpen: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, guardOpen, pathname, LIVELIHOOD_DOCUMENT_GUARD_OPEN_PARAM);
}
