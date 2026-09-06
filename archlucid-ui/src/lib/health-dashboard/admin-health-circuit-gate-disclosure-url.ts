export const ADMIN_HEALTH_CIRCUIT_GATE_ID_PARAM = "adminHealthCircuitGateId";

export function parseAdminHealthCircuitGateIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function adminHealthCircuitGateDisclosureHrefFromSearch(
  currentSearch: string,
  gateId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (gateId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(ADMIN_HEALTH_CIRCUIT_GATE_ID_PARAM);
  } else {
    params.set(ADMIN_HEALTH_CIRCUIT_GATE_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
