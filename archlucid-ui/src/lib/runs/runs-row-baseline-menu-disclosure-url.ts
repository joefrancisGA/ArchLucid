export const RUNS_ROW_BASELINE_MENU_RUN_ID_PARAM = "runsRowBaselineMenuRunId";

export function parseRunsRowBaselineMenuRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function runsRowBaselineMenuDisclosureHrefFromSearch(
  currentSearch: string,
  runId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const trimmed = (runId ?? "").trim();

  if (trimmed.length === 0) {
    params.delete(RUNS_ROW_BASELINE_MENU_RUN_ID_PARAM);
  } else {
    params.set(RUNS_ROW_BASELINE_MENU_RUN_ID_PARAM, trimmed);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
