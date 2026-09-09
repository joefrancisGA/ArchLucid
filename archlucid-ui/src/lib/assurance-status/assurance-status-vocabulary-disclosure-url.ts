export const ASSURANCE_STATUS_VOCABULARY_OPEN_PARAM = "assuranceStatusVocabularyOpen";

export function parseAssuranceStatusVocabularyOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function assuranceStatusVocabularyDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ASSURANCE_STATUS_VOCABULARY_OPEN_PARAM);
  } else {
    params.set(ASSURANCE_STATUS_VOCABULARY_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
