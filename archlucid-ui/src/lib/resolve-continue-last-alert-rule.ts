import type { AlertRule } from "@/types/alerts";

export const ALERT_RULE_LAST_VIEWED_STORAGE_KEY = "archlucid_alert_rule_continue_last_v1";

export type AlertRulesContinueLastTarget = {
  readonly ruleId: string;
  readonly name: string;
};

function readStoredRuleId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(ALERT_RULE_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeAlertRuleLastViewedId(ruleId: string): void {
  const normalized = ruleId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ALERT_RULE_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(rule: AlertRule): AlertRulesContinueLastTarget {
  return {
    ruleId: rule.ruleId,
    name: rule.name.trim().length > 0 ? rule.name : "Alert rule",
  };
}

/** Resolves the alert rule to pin as Continue last viewed. */
export function resolveContinueLastAlertRule(rules: readonly AlertRule[]): AlertRulesContinueLastTarget | null {
  if (rules.length === 0) {
    return null;
  }

  const storedId = readStoredRuleId();

  if (storedId !== null) {
    const storedMatch = rules.find((rule) => rule.ruleId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const newest = rules.slice().sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
