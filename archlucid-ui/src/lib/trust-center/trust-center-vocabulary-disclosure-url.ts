import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const TRUST_CENTER_VOCABULARY_OPEN_PARAM = "trustCenterVocabularyOpen";

export function parseTrustCenterVocabularyOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function trustCenterVocabularyDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, TRUST_CENTER_VOCABULARY_OPEN_PARAM);
}
