import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_OPEN_PARAM = "helpTroubleshootingAdvancedDiagnosticsOpen";

export function parseHelpTroubleshootingAdvancedDiagnosticsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function helpTroubleshootingAdvancedDiagnosticsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, HELP_TROUBLESHOOTING_ADVANCED_DIAGNOSTICS_OPEN_PARAM);
}
