export const SERVICE_BUS_HEALTH_TECHNICAL_PROBE_OPEN_PARAM = "serviceBusHealthTechnicalProbeOpen";

export function parseServiceBusHealthTechnicalProbeOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function serviceBusHealthTechnicalProbeDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(SERVICE_BUS_HEALTH_TECHNICAL_PROBE_OPEN_PARAM);
  } else {
    params.set(SERVICE_BUS_HEALTH_TECHNICAL_PROBE_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
