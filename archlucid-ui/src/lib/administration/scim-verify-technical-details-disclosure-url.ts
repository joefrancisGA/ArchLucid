export const SCIM_VERIFY_TECHNICAL_DETAILS_OPEN_PARAM = "scimVerifyTechnicalDetailsOpen";

export function parseScimVerifyTechnicalDetailsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function scimVerifyTechnicalDetailsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SCIM_VERIFY_TECHNICAL_DETAILS_OPEN_PARAM);
  } else {
    params.set(SCIM_VERIFY_TECHNICAL_DETAILS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
