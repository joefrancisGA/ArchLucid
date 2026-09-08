export const INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM = "infraResourceRowArmIdDisclosureKey";

export function parseInfraResourceRowArmIdDisclosureKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function infraResourceRowArmIdDisclosureHrefFromSearch(
  currentSearch: string,
  cloudResourceId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (cloudResourceId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM);
  } else {
    params.set(INFRA_RESOURCE_ROW_ARM_ID_DISCLOSURE_KEY_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
