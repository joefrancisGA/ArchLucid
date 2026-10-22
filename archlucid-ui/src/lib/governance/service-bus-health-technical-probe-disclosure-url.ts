import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, SERVICE_BUS_HEALTH_TECHNICAL_PROBE_OPEN_PARAM);
}
