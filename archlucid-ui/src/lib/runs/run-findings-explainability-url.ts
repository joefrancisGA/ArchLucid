import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
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
    },
  });
}
