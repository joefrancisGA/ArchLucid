export const GOVERNANCE_FINDING_DERIVATION_ID_PARAM = "governanceFindingDerivationId";

export function parseGovernanceFindingDerivationIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function governanceFindingDerivationDisclosureHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (findingId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(GOVERNANCE_FINDING_DERIVATION_ID_PARAM);
  } else {
    params.set(GOVERNANCE_FINDING_DERIVATION_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
