import {
  formatCompositeAlertConditionSummary,
  labelForCompositeJoinOperator,
} from "@/lib/composite-alert-rules-labels";
import { labelForAlertPriority } from "@/lib/alert-rule-conditions";
import type { CompositeAlertRuleCondition } from "@/types/composite-alert-rules";

export const COMPOSITE_ALERT_RULE_NAME_PLACEHOLDER = "e.g. Cost + compliance composite";

export const COMPOSITE_ALERT_RULE_SUPPRESSION_MIN = 1;
export const COMPOSITE_ALERT_RULE_SUPPRESSION_MAX = 10_080;
export const COMPOSITE_ALERT_RULE_COOLDOWN_MIN = 0;
export const COMPOSITE_ALERT_RULE_COOLDOWN_MAX = 10_080;
export const COMPOSITE_ALERT_RULE_THRESHOLD_MIN = 0;
export const COMPOSITE_ALERT_RULE_THRESHOLD_MAX = 10_000;

export type CompositeAlertRuleFormConditionInput = {
  readonly metricType: string;
  readonly operator: string;
  readonly thresholdValue: number;
};

export type CompositeAlertRuleFormInput = {
  readonly name: string;
  readonly severity: string;
  readonly joinOperator: string;
  readonly suppressionWindowMinutes: number;
  readonly cooldownMinutes: number;
  readonly dedupeScope: string;
  readonly condition1: CompositeAlertRuleFormConditionInput;
  readonly condition2: CompositeAlertRuleFormConditionInput;
};

export type CompositeAlertRuleFormFieldErrors = {
  name?: string;
  threshold1?: string;
  threshold2?: string;
  suppressionWindowMinutes?: string;
  cooldownMinutes?: string;
  metrics?: string;
};

function validateCompositeAlertRuleName(name: string): string | undefined {
  if (name.trim().length === 0) {
    return "Enter a name for this composite rule.";
  }

  return undefined;
}

function validateCompositeAlertRuleThreshold(
  thresholdValue: number,
  fieldLabel: string,
): string | undefined {
  if (!Number.isFinite(thresholdValue)) {
    return `Enter a numeric threshold for ${fieldLabel}.`;
  }

  if (thresholdValue < COMPOSITE_ALERT_RULE_THRESHOLD_MIN || thresholdValue > COMPOSITE_ALERT_RULE_THRESHOLD_MAX) {
    return `${fieldLabel} must be between ${COMPOSITE_ALERT_RULE_THRESHOLD_MIN} and ${COMPOSITE_ALERT_RULE_THRESHOLD_MAX}.`;
  }

  return undefined;
}

function validateCompositeAlertRuleSuppressionMinutes(value: number): string | undefined {
  if (!Number.isInteger(value)) {
    return "Suppression window must be a whole number of minutes.";
  }

  if (value < COMPOSITE_ALERT_RULE_SUPPRESSION_MIN || value > COMPOSITE_ALERT_RULE_SUPPRESSION_MAX) {
    return `Suppression window must be between ${COMPOSITE_ALERT_RULE_SUPPRESSION_MIN} and ${COMPOSITE_ALERT_RULE_SUPPRESSION_MAX} minutes.`;
  }

  return undefined;
}

function validateCompositeAlertRuleCooldownMinutes(value: number): string | undefined {
  if (!Number.isInteger(value)) {
    return "Cooldown must be a whole number of minutes.";
  }

  if (value < COMPOSITE_ALERT_RULE_COOLDOWN_MIN || value > COMPOSITE_ALERT_RULE_COOLDOWN_MAX) {
    return `Cooldown must be between ${COMPOSITE_ALERT_RULE_COOLDOWN_MIN} and ${COMPOSITE_ALERT_RULE_COOLDOWN_MAX} minutes.`;
  }

  return undefined;
}

function validateDistinctCompositeMetrics(
  condition1: CompositeAlertRuleFormConditionInput,
  condition2: CompositeAlertRuleFormConditionInput,
): string | undefined {
  if (condition1.metricType.trim().length === 0 || condition2.metricType.trim().length === 0) {
    return undefined;
  }

  if (condition1.metricType === condition2.metricType) {
    return "Choose two different metrics — each condition must measure a distinct signal.";
  }

  return undefined;
}

export function validateCompositeAlertRuleForm(input: CompositeAlertRuleFormInput): CompositeAlertRuleFormFieldErrors {
  const name = validateCompositeAlertRuleName(input.name);
  const threshold1 = validateCompositeAlertRuleThreshold(input.condition1.thresholdValue, "Condition 1");
  const threshold2 = validateCompositeAlertRuleThreshold(input.condition2.thresholdValue, "Condition 2");
  const suppressionWindowMinutes = validateCompositeAlertRuleSuppressionMinutes(input.suppressionWindowMinutes);
  const cooldownMinutes = validateCompositeAlertRuleCooldownMinutes(input.cooldownMinutes);
  const metrics = validateDistinctCompositeMetrics(input.condition1, input.condition2);

  return {
    ...(name !== undefined ? { name } : {}),
    ...(threshold1 !== undefined ? { threshold1 } : {}),
    ...(threshold2 !== undefined ? { threshold2 } : {}),
    ...(suppressionWindowMinutes !== undefined ? { suppressionWindowMinutes } : {}),
    ...(cooldownMinutes !== undefined ? { cooldownMinutes } : {}),
    ...(metrics !== undefined ? { metrics } : {}),
  };
}

export function isCompositeAlertRuleFormValid(input: CompositeAlertRuleFormInput): boolean {
  return Object.keys(validateCompositeAlertRuleForm(input)).length === 0;
}

export function formatCompositeAlertRuleCreateConfirmationSummary(input: CompositeAlertRuleFormInput): string {
  const trimmedName = input.name.trim() || "Untitled composite rule";
  const joinLabel = labelForCompositeJoinOperator(input.joinOperator);
  const priorityLabel = labelForAlertPriority(input.severity);
  const conditionLines = [input.condition1, input.condition2].map((condition) =>
    formatCompositeAlertConditionSummary(condition as CompositeAlertRuleCondition),
  );

  return `“${trimmedName}” will fire a ${priorityLabel} alert when ${joinLabel.toLowerCase()}: ${conditionLines.join("; ")}.`;
}
