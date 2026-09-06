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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ADMIN_HEALTH_CONFIG_PROBES_OPEN_PARAM);
  } else {
    params.set(ADMIN_HEALTH_CONFIG_PROBES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
