import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const ADMIN_HEALTH_CONFIG_PROBES_OPEN_PARAM = "adminHealthConfigProbesOpen";

export function parseAdminHealthConfigProbesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function adminHealthConfigProbesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, ADMIN_HEALTH_CONFIG_PROBES_OPEN_PARAM);
}
