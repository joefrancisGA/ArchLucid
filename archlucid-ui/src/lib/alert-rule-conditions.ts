import type { AlertRule } from "@/types/alerts";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

export const ALERT_RULE_TYPE_OPTIONS = [
  { value: "CriticalRecommendationCount", label: "Critical and high-severity finding count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count (security deltas)" },
  { value: "CostIncreasePercent", label: "Cost increase percentage" },
  { value: "DeferredHighPriorityRecommendationAgeDays", label: "Deferred high-priority finding age (days)" },
  { value: "RejectedSecurityRecommendation", label: "Rejected security finding" },
  { value: "AcceptanceRateDrop", label: "Acceptance rate below percentage" },
] as const;

export const ALERT_PRIORITY_OPTIONS = ["Info", "Warning", "High", "Critical"] as const;

export const ALERT_RULE_THRESHOLD_MIN = 1;
export const ALERT_RULE_THRESHOLD_MAX = 10_000;

export type AlertRuleFormInput = {
  readonly name: string;
  readonly ruleType: string;
  readonly alertPriority: string;
  readonly thresholdValue: number;
};

/** Empty Rules-tab create draft — TB-1574 treats this as sparse (do not pin live rail). */
export const ALERT_RULE_FORM_DEFAULT_DRAFT: AlertRuleFormInput = {
  name: "Architecture alert rule",
  ruleType: "CriticalRecommendationCount",
  alertPriority: "Warning",
  thresholdValue: 3,
};

/** True when the create form left the empty default draft (pin-worthy for live preview). */
export function alertRuleFormDiffersFromDefaultDraft(input: AlertRuleFormInput): boolean {
  return (
    input.name !== ALERT_RULE_FORM_DEFAULT_DRAFT.name ||
    input.ruleType !== ALERT_RULE_FORM_DEFAULT_DRAFT.ruleType ||
    input.alertPriority !== ALERT_RULE_FORM_DEFAULT_DRAFT.alertPriority ||
    input.thresholdValue !== ALERT_RULE_FORM_DEFAULT_DRAFT.thresholdValue
  );
}

/** Mutable field-error bag — built incrementally in validateAlertRuleForm. */
export type AlertRuleFormFieldErrors = {
  name?: string;
  thresholdValue?: string;
  alertPriority?: string;
};

export type AlertRuleNotificationReadiness = {
  readonly inAppAlertsEnabled: boolean;
  readonly externalNotificationsConfigured: boolean;
};

export function labelForAlertRuleType(ruleType: string): string {
  const match = ALERT_RULE_TYPE_OPTIONS.find((option) => option.value === ruleType);

  if (match !== undefined) {
    return match.label;
  }

  return "Custom alert condition";
}

export function labelForAlertPriority(priority: string): string {
  const normalized = priority.trim();

  if (normalized.length === 0) {
    return "Unset";
  }

  return normalized;
}

export function describeAlertRuleScope(rule: Pick<AlertRule, "projectId">): string {
  const projectId = rule.projectId?.trim() ?? "";

  if (projectId.length > 0 && projectId.toLowerCase() !== "default") {
    return "This rule applies to eligible reviews in the current project scope.";
  }

  return "This rule applies to eligible reviews in the current workspace.";
}

/**
 * Resolves Conditions scope-preview projectId without inventing `default` (TB-1587).
 * Prefer a persisted rule's projectId; else the operator session selection; else omit (empty).
 */
export function resolveAlertRuleScopePreviewProjectId(
  persistedProjectId: string | null | undefined,
  sessionProjectId: string | null | undefined,
): string {
  const fromPersisted = persistedProjectId?.trim() ?? "";

  if (fromPersisted.length > 0) {
    return fromPersisted;
  }

  const fromSession = sessionProjectId?.trim() ?? "";

  if (fromSession.length > 0) {
    return fromSession;
  }

  return "";
}

export function describeThresholdComparison(ruleType: string): string {
  switch (ruleType) {
    case "AcceptanceRateDrop":
      return "Trigger when the acceptance rate falls below:";
    case "DeferredHighPriorityRecommendationAgeDays":
      return "Trigger when a deferred high-priority finding has been open longer than (days):";
    case "RejectedSecurityRecommendation":
      return "Trigger when any rejected security finding is present (threshold is not used).";
    case "CostIncreasePercent":
      return "Trigger when projected cost increases by at least:";
    default:
      return "Trigger when the count is at least:";
  }
}

export function usesIntegerThreshold(ruleType: string): boolean {
  return ruleType !== "CostIncreasePercent" && ruleType !== "AcceptanceRateDrop";
}

export function validateAlertRuleForm(input: AlertRuleFormInput): AlertRuleFormFieldErrors {
  const trimmedName = input.name.trim();
  const priority = input.alertPriority.trim();
  const nameError = trimmedName.length === 0 ? "Enter a name for this alert rule." : undefined;
  const alertPriorityError = priority.length === 0 ? "Choose an alert priority." : undefined;

  if (input.ruleType === "RejectedSecurityRecommendation") {
    return buildAlertRuleFormFieldErrors(nameError, alertPriorityError, undefined);
  }

  if (!Number.isFinite(input.thresholdValue)) {
    return buildAlertRuleFormFieldErrors(nameError, alertPriorityError, "Enter a numeric threshold.");
  }

  if (usesIntegerThreshold(input.ruleType) && !Number.isInteger(input.thresholdValue)) {
    return buildAlertRuleFormFieldErrors(
      nameError,
      alertPriorityError,
      "Enter a whole number for this threshold.",
    );
  }

  const thresholdValueError =
    input.thresholdValue < ALERT_RULE_THRESHOLD_MIN || input.thresholdValue > ALERT_RULE_THRESHOLD_MAX
      ? `Threshold must be between ${ALERT_RULE_THRESHOLD_MIN} and ${ALERT_RULE_THRESHOLD_MAX}.`
      : undefined;

  return buildAlertRuleFormFieldErrors(nameError, alertPriorityError, thresholdValueError);
}

function buildAlertRuleFormFieldErrors(
  name: string | undefined,
  alertPriority: string | undefined,
  thresholdValue: string | undefined,
): AlertRuleFormFieldErrors {
  return {
    ...(name !== undefined ? { name } : {}),
    ...(alertPriority !== undefined ? { alertPriority } : {}),
    ...(thresholdValue !== undefined ? { thresholdValue } : {}),
  };
}

export function isAlertRuleFormValid(input: AlertRuleFormInput): boolean {
  const errors = validateAlertRuleForm(input);

  return Object.keys(errors).length === 0;
}

export function formatAlertRulePreview(input: AlertRuleFormInput): string {
  const conditionLabel = labelForAlertRuleType(input.ruleType);
  const priorityLabel = labelForAlertPriority(input.alertPriority);
  const trimmedName = input.name.trim() || "Untitled alert rule";

  if (input.ruleType === "RejectedSecurityRecommendation") {
    return `“${trimmedName}” raises a ${priorityLabel} alert when a rejected security finding is detected in scope.`;
  }

  if (input.ruleType === "AcceptanceRateDrop") {
    return `“${trimmedName}” raises a ${priorityLabel} alert when the acceptance rate falls below ${input.thresholdValue}%.`;
  }

  if (input.ruleType === "CostIncreasePercent") {
    return `“${trimmedName}” raises a ${priorityLabel} alert when projected cost increases by at least ${input.thresholdValue}%.`;
  }

  if (input.ruleType === "DeferredHighPriorityRecommendationAgeDays") {
    return `“${trimmedName}” raises a ${priorityLabel} alert when a deferred high-priority finding remains open longer than ${input.thresholdValue} days.`;
  }

  return `“${trimmedName}” raises a ${priorityLabel} alert when ${conditionLabel.toLowerCase()} reaches at least ${input.thresholdValue}.`;
}

export function formatPersistedAlertRuleSummary(rule: AlertRule): string {
  return formatAlertRulePreview({
    name: rule.name,
    ruleType: rule.ruleType,
    alertPriority: rule.severity,
    thresholdValue: rule.thresholdValue,
  });
}

export function resolveAlertRuleNotificationReadiness(
  rule: Pick<AlertRule, "isEnabled">,
  routingSubscriptions: readonly AlertRoutingSubscription[],
): AlertRuleNotificationReadiness {
  const externalNotificationsConfigured = routingSubscriptions.some((subscription) => subscription.isEnabled);

  return {
    inAppAlertsEnabled: rule.isEnabled,
    externalNotificationsConfigured,
  };
}

export function alertRuleActiveStatusLabel(isEnabled: boolean): string {
  if (isEnabled) {
    return "Active";
  }

  return "Paused";
}
