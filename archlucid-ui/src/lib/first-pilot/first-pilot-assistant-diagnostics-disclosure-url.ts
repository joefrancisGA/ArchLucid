import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FIRST_PILOT_ASSISTANT_DIAGNOSTICS_OPEN_PARAM = "firstPilotAssistantDiagnosticsOpen";

export function parseFirstPilotAssistantDiagnosticsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function firstPilotAssistantDiagnosticsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, FIRST_PILOT_ASSISTANT_DIAGNOSTICS_OPEN_PARAM);
}
