import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const QUICK_DECISION_REASONING_FINDING_ID_PARAM = "qdReasonId";

export function parseQuickDecisionReasoningFindingIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function quickDecisionReasoningPanelsHrefFromSearch(
  currentSearch: string,
  findingId: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (findingId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(QUICK_DECISION_REASONING_FINDING_ID_PARAM);
    } else {
      params.set(QUICK_DECISION_REASONING_FINDING_ID_PARAM, trimmed);
    }
    },
  });
}
