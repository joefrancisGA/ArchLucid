export const HELP_DATA_HANDLING_TENANT_ISOLATION_SOURCES_OPEN_PARAM =
  "helpDataHandlingTenantIsolationSourcesOpen";

export function parseHelpDataHandlingTenantIsolationSourcesOpenFromSearch(
  raw: string | null | undefined,
): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpDataHandlingTenantIsolationSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(HELP_DATA_HANDLING_TENANT_ISOLATION_SOURCES_OPEN_PARAM);
  } else {
    params.set(HELP_DATA_HANDLING_TENANT_ISOLATION_SOURCES_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
