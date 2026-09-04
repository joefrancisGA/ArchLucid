export const FINDINGS_WHAT_IF_PARAM = "whatIf";
export const FINDINGS_WHAT_IF_IDS_PARAM = "whatIfIds";

export type FindingsWhatIfAnalysisUrlState = {
  readonly enabled: boolean;
  readonly findingIds: readonly string[];
};

export function parseFindingsWhatIfEnabledFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseFindingsWhatIfIdsFromSearch(raw: string | null | undefined): readonly string[] {
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

export function findingsWhatIfAnalysisHrefFromSearch(
  currentSearch: string,
  state: FindingsWhatIfAnalysisUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const ids = state.findingIds.map((id) => id.trim()).filter((id) => id.length > 0);

  if (!state.enabled) {
    params.delete(FINDINGS_WHAT_IF_PARAM);
    params.delete(FINDINGS_WHAT_IF_IDS_PARAM);
  } else {
    params.set(FINDINGS_WHAT_IF_PARAM, "1");

    if (ids.length === 0) {
      params.delete(FINDINGS_WHAT_IF_IDS_PARAM);
    } else {
      params.set(FINDINGS_WHAT_IF_IDS_PARAM, ids.join(","));
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
