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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(TRUST_CENTER_VOCABULARY_OPEN_PARAM);
  } else {
    params.set(TRUST_CENTER_VOCABULARY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
