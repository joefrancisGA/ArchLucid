export const HEALTHCARE_CLAIMS_PACK_TECHNICAL_OPEN_PARAM = "healthcareClaimsPackTechnicalOpen";

export function parseHealthcareClaimsPackTechnicalOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function healthcareClaimsPackTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HEALTHCARE_CLAIMS_PACK_TECHNICAL_OPEN_PARAM);
  } else {
    params.set(HEALTHCARE_CLAIMS_PACK_TECHNICAL_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
