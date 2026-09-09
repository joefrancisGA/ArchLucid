export const TECHNICAL_ID_DISCLOSURE_KEY_PARAM = "technicalIdDisclosureKey";

export function parseTechnicalIdDisclosureKeyFromSearch(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed.length === 0 ? null : trimmed;
}

export function technicalIdDisclosureKeyDisclosureHrefFromSearch(
  currentSearch: string,
  disclosureKey: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (disclosureKey === null || disclosureKey.trim().length === 0) {
    params.delete(TECHNICAL_ID_DISCLOSURE_KEY_PARAM);
  } else {
    params.set(TECHNICAL_ID_DISCLOSURE_KEY_PARAM, disclosureKey.trim());
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
