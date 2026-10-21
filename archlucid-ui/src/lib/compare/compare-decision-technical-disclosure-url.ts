import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const COMPARE_DECISION_TECHNICAL_KEY_PARAM = "compareDecisionTechnicalKey";

export function parseCompareDecisionTechnicalKeyFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function compareDecisionTechnicalDisclosureHrefFromSearch(
  currentSearch: string,
  decisionKey: string | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (decisionKey ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(COMPARE_DECISION_TECHNICAL_KEY_PARAM);
    } else {
      params.set(COMPARE_DECISION_TECHNICAL_KEY_PARAM, trimmed);
    }
    },
  });
}
