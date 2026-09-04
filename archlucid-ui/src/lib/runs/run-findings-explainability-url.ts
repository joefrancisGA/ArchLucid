export const RUN_FINDINGS_EXPLAIN_ID_PARAM = "explainId";
export const RUN_FINDINGS_REASON_ID_PARAM = "reasonId";

export type RunFindingsExplainabilityUrlState = {
  readonly explainFindingId: string | null;
  readonly reasoningFindingId: string | null;
};

export function parseRunFindingsExplainIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseRunFindingsReasonIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function runFindingsExplainabilityHrefFromSearch(
  currentSearch: string,
  state: RunFindingsExplainabilityUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);
  const explainId = (state.explainFindingId ?? "").trim();
  const reasonId = (state.reasoningFindingId ?? "").trim();

  if (explainId.length === 0) {
    params.delete(RUN_FINDINGS_EXPLAIN_ID_PARAM);
  } else {
    params.set(RUN_FINDINGS_EXPLAIN_ID_PARAM, explainId);
  }

  if (reasonId.length === 0) {
    params.delete(RUN_FINDINGS_REASON_ID_PARAM);
  } else {
    params.set(RUN_FINDINGS_REASON_ID_PARAM, reasonId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
