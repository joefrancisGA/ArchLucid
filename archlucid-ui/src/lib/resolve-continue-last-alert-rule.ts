import { asNonemptyReadonlyArray } from "@/lib/continue-last-list-guard";
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
export function resolveContinueLastAlertRule(rules: unknown): AlertRulesContinueLastTarget | null {
  const normalizedRules = asNonemptyReadonlyArray<AlertRule>(rules);

  if (normalizedRules === null) {
    return null;
  }

  const storedId = readStoredRuleId();

  if (storedId !== null) {
    const storedMatch = normalizedRules.find((rule) => rule.ruleId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const newest = normalizedRules
    .slice()
    .sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
