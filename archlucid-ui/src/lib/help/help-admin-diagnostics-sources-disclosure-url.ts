import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_ADMIN_DIAGNOSTICS_SOURCES_OPEN_PARAM = "helpAdminDiagnosticsSourcesOpen";

export function parseHelpAdminDiagnosticsSourcesOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpAdminDiagnosticsSourcesDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_ADMIN_DIAGNOSTICS_SOURCES_OPEN_PARAM);
}
