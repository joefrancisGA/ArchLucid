import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const RUNS_LIST_PATH = "/architecture/reviews" as const;

export const RUNS_LIST_INSPECTOR_RUN_PARAM = "inspectorRunId";
export const RUNS_LIST_COMPARE_RUNS_PARAM = "compareRuns";

export type RunsListCompareInspectorUrlState = {
  readonly inspectorRunId: string | null;
  readonly compareRunIds: readonly string[];
};

export function parseRunsListInspectorRunIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseRunsListCompareRunIdsFromSearch(raw: string | null | undefined): readonly string[] {
  if (raw === null || raw === undefined) {
    return [];
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return [];
  }

  return trimmed
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function runsListCompareInspectorHrefFromSearch(
  currentSearch: string,
  state: RunsListCompareInspectorUrlState,
  pathname: string = RUNS_LIST_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const inspectorRunId = (state.inspectorRunId ?? "").trim();
    const compareRunIds = state.compareRunIds.map((id) => id.trim()).filter((id) => id.length > 0);

    if (inspectorRunId.length === 0) {
      params.delete(RUNS_LIST_INSPECTOR_RUN_PARAM);
    } else {
      params.set(RUNS_LIST_INSPECTOR_RUN_PARAM, inspectorRunId);
    }

    if (compareRunIds.length === 0) {
      params.delete(RUNS_LIST_COMPARE_RUNS_PARAM);
    } else {
      params.set(RUNS_LIST_COMPARE_RUNS_PARAM, compareRunIds.join(","));
    }
    },
  });
}
