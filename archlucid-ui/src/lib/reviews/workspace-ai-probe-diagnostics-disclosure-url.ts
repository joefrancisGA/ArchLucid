import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM = "workspaceAiProbeDiagnosticsOpen";

export function parseWorkspaceAiProbeDiagnosticsOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function workspaceAiProbeDiagnosticsDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM);
}
