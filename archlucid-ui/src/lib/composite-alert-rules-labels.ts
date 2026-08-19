import { alertRuleActiveStatusLabel, labelForAlertPriority } from "@/lib/alert-rule-conditions";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { CompositeAlertRule, CompositeAlertRuleCondition } from "@/types/composite-alert-rules";

export const COMPOSITE_ALERT_METRIC_OPTIONS = [
  { value: "CriticalRecommendationCount", label: "Critical/high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count (security deltas)" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationCount", label: "Deferred high-priority count" },
  { value: "RejectedSecurityRecommendationCount", label: "Rejected security recommendations" },
  { value: "AcceptanceRatePercent", label: "Acceptance rate %" },
] as const;

export const COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS = [
  { value: "GreaterThanOrEqual", label: "≥" },
  { value: "GreaterThan", label: ">" },
  { value: "LessThanOrEqual", label: "≤" },
  { value: "LessThan", label: "<" },
  { value: "Equal", label: "=" },
  { value: "NotEqual", label: "≠" },
] as const;

export const COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS = [
  { value: "And", label: "All conditions (AND)" },
  { value: "Or", label: "Any condition (OR)" },
] as const;

export const COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS = [
  { value: "RuleOnly", label: "Rule only" },
  { value: "RuleAndRun", label: "Rule + review" },
  { value: "RuleAndComparison", label: "Rule + review + comparison" },
] as const;

function labelFromOptions(
  options: readonly { readonly value: string; readonly label: string }[],
  value: string,
  fallback: string,
): string {
  const match = options.find((option) => option.value === value);

  if (match !== undefined) {
    return match.label;
  }

  return fallback;
}

export function labelForCompositeAlertMetricType(metricType: string): string {
  return labelFromOptions(COMPOSITE_ALERT_METRIC_OPTIONS, metricType, "Custom metric");
}

export function labelForCompositeConditionOperator(operator: string): string {
  return labelFromOptions(COMPOSITE_ALERT_CONDITION_OPERATOR_OPTIONS, operator, "Custom comparison");
}

export function labelForCompositeJoinOperator(operator: string): string {
  return labelFromOptions(COMPOSITE_ALERT_JOIN_OPERATOR_OPTIONS, operator, "Custom combine logic");
}

export function labelForCompositeDedupeScope(dedupeScope: string): string {
  return labelFromOptions(COMPOSITE_ALERT_DEDUPE_SCOPE_OPTIONS, dedupeScope, "Custom dedupe scope");
}

export function compositeAlertRuleStatusLabel(isEnabled: boolean): string {
  return alertRuleActiveStatusLabel(isEnabled);
}

export function compositeAlertRuleStatusKind(isEnabled: boolean): EnterpriseStatusKind {
  if (isEnabled) {
    return "ready";
  }

  return "neutral";
}

export function formatCompositeAlertConditionSummary(condition: CompositeAlertRuleCondition): string {
  const metricLabel = labelForCompositeAlertMetricType(condition.metricType);
  const operatorLabel = labelForCompositeConditionOperator(condition.operator);

  return `${metricLabel} ${operatorLabel} ${condition.thresholdValue}`;
}

function formatCompositeAlertRuleCreatedLabel(createdUtc: string | null | undefined): string | null {
  const trimmed = createdUtc?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  const formatted = formatInstantForLocale(trimmed);

  if (formatted === "—") {
    return null;
  }

  return `Created ${formatted}`;
}

export function formatCompositeAlertRuleSummary(rule: CompositeAlertRule): string {
  const joinLabel = labelForCompositeJoinOperator(rule.operator);
  const priorityLabel = labelForAlertPriority(rule.severity);
  const dedupeLabel = labelForCompositeDedupeScope(rule.dedupeScope);
  const createdLabel = formatCompositeAlertRuleCreatedLabel(rule.createdUtc);
  const createdSegment = createdLabel !== null ? ` · ${createdLabel}` : "";

  return `Combine: ${joinLabel} · Alert priority: ${priorityLabel} · Suppression: ${rule.suppressionWindowMinutes} min · Cooldown: ${rule.cooldownMinutes} min · Dedupe: ${dedupeLabel}${createdSegment}`;
}
