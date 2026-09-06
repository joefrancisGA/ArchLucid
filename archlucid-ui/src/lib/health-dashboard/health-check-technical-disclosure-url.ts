export const HEALTH_CHECK_TECHNICAL_ID_PARAM = "healthCheckTechnicalId";

export function parseHealthCheckTechnicalIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function healthCheckTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  checkId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (checkId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(HEALTH_CHECK_TECHNICAL_ID_PARAM);
  } else {
    params.set(HEALTH_CHECK_TECHNICAL_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
