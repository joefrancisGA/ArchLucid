import type { CompositeAlertRule } from "@/types/composite-alert-rules";

export const COMPOSITE_ALERT_RULE_LAST_VIEWED_STORAGE_KEY =
  "archlucid_composite_alert_rule_continue_last_v1";

export type CompositeAlertRulesContinueLastTarget = {
  readonly ruleId: string;
  readonly name: string;
};

function readStoredRuleId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(COMPOSITE_ALERT_RULE_LAST_VIEWED_STORAGE_KEY)?.trim() ?? "";

    return stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
}

export function writeCompositeAlertRuleLastViewedId(ruleId: string): void {
  const normalized = ruleId.trim();

  if (normalized.length === 0 || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COMPOSITE_ALERT_RULE_LAST_VIEWED_STORAGE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

function toTarget(rule: CompositeAlertRule): CompositeAlertRulesContinueLastTarget {
  return {
    ruleId: rule.compositeRuleId,
    name: rule.name.trim().length > 0 ? rule.name : "Composite alert rule",
  };
}

/** Resolves the composite alert rule to pin as Continue last viewed. */
export function resolveContinueLastCompositeAlertRule(
  rules: unknown,
): CompositeAlertRulesContinueLastTarget | null {
  if (!Array.isArray(rules) || rules.length === 0) {
    return null;
  }

  const normalizedRules = rules as readonly CompositeAlertRule[];

  const storedId = readStoredRuleId();

  if (storedId !== null) {
    const storedMatch = normalizedRules.find((rule) => rule.compositeRuleId === storedId);

    if (storedMatch !== undefined) {
      return toTarget(storedMatch);
    }
  }

  const newest = normalizedRules
    .slice()
    .sort((left, right) => right.createdUtc.localeCompare(left.createdUtc))[0];

  return newest === undefined ? null : toTarget(newest);
}
