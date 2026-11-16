import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { AlertRule } from "@/types/alerts";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";
import { recordsOnly, trimRequiredText, trimTextFields } from "./api-boundary-normalization";
import { apiGet, apiPostJson } from "./http";

export async function listAlertRules(): Promise<AlertRule[]> {
  return recordsOnly<AlertRule>(await apiGet<unknown>(`/${ApiV1Routes.alertRules}`));
}

/** Creates a new simple alert rule with a severity and threshold. */
export async function createAlertRule(body: {
  name: string;
  ruleType: string;
  severity: string;
  thresholdValue: number;
  isEnabled?: boolean;
  targetChannelType?: string;
  metadataJson?: string;
}): Promise<AlertRule> {
  const normalized = trimTextFields(body, [
    "name",
    "ruleType",
    "severity",
    "targetChannelType",
  ]);

  return apiPostJson<AlertRule>(`/${ApiV1Routes.alertRules}`, {
    name: trimRequiredText(normalized.name, "name"),
    ruleType: trimRequiredText(normalized.ruleType, "ruleType"),
    severity: trimRequiredText(normalized.severity, "severity"),
    thresholdValue: normalized.thresholdValue,
    isEnabled: normalized.isEnabled ?? true,
    targetChannelType: normalized.targetChannelType || "DigestOnly",
    metadataJson: normalized.metadataJson ?? "{}",
  });
}

export async function listCompositeAlertRules(): Promise<CompositeAlertRule[]> {
  return recordsOnly<CompositeAlertRule>(await apiGet<unknown>(`/${ApiV1Routes.compositeAlertRules}`));
}

/** Creates a composite alert rule with multiple metric conditions and suppression/cooldown settings. */
export async function createCompositeAlertRule(body: {
  name: string;
  severity: string;
  operator: string;
  suppressionWindowMinutes: number;
  cooldownMinutes: number;
  reopenDeltaThreshold: number;
  dedupeScope: string;
  isEnabled?: boolean;
  targetChannelType?: string;
  conditions: { metricType: string; operator: string; thresholdValue: number }[];
}): Promise<CompositeAlertRule> {
  const normalized = trimTextFields(body, [
    "name",
    "severity",
    "operator",
    "dedupeScope",
    "targetChannelType",
  ]);
  const conditions = body.conditions.map((condition) => ({
    metricType: condition.metricType.trim(),
    operator: condition.operator.trim(),
    thresholdValue: condition.thresholdValue,
  }));

  if (conditions.some((condition) => condition.metricType.length === 0 || condition.operator.length === 0)) {
    throw new Error("Composite alert condition fields are required.");
  }

  return apiPostJson<CompositeAlertRule>(`/${ApiV1Routes.compositeAlertRules}`, {
    name: trimRequiredText(normalized.name, "name"),
    severity: trimRequiredText(normalized.severity, "severity"),
    operator: trimRequiredText(normalized.operator, "operator"),
    isEnabled: normalized.isEnabled ?? true,
    suppressionWindowMinutes: normalized.suppressionWindowMinutes,
    cooldownMinutes: normalized.cooldownMinutes,
    reopenDeltaThreshold: normalized.reopenDeltaThreshold,
    dedupeScope: trimRequiredText(normalized.dedupeScope, "dedupeScope"),
    targetChannelType: normalized.targetChannelType || "AlertRouting",
    conditions,
  });
}
