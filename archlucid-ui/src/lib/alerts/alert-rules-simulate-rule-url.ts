import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const ALERT_RULES_SIMULATE_RULE_PARAM = "simulateRule";

export function parseAlertRulesSimulateRuleIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertRulesSimulateRuleHrefFromSearch(
  currentSearch: string,
  ruleId: string | null,
  pathname: string = GOVERNANCE_ALERT_RULES_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {
    const trimmed = (ruleId ?? "").trim();

    if (trimmed.length === 0) {
      params.delete(ALERT_RULES_SIMULATE_RULE_PARAM);
    } else {
      params.set(ALERT_RULES_SIMULATE_RULE_PARAM, trimmed);
    }
    },
  });
}
