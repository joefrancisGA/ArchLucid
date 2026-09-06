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
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM);
  } else {
    params.set(WORKSPACE_AI_PROBE_DIAGNOSTICS_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
