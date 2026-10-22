import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { AlertRule } from "@/types/alerts";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";
import { apiGet, apiPostJson } from "./http";

export async function listAlertRules(): Promise<AlertRule[]> {
  return apiGet<AlertRule[]>(`/${ApiV1Routes.alertRules}`);
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
  return apiPostJson<AlertRule>(`/${ApiV1Routes.alertRules}`, {
    name: body.name,
    ruleType: body.ruleType,
    severity: body.severity,
    thresholdValue: body.thresholdValue,
    isEnabled: body.isEnabled ?? true,
    targetChannelType: body.targetChannelType ?? "DigestOnly",
    metadataJson: body.metadataJson ?? "{}",
  });
}

export async function listCompositeAlertRules(): Promise<CompositeAlertRule[]> {
  return apiGet<CompositeAlertRule[]>(`/${ApiV1Routes.compositeAlertRules}`);
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
  return apiPostJson<CompositeAlertRule>(`/${ApiV1Routes.compositeAlertRules}`, {
    name: body.name,
    severity: body.severity,
    operator: body.operator,
    isEnabled: body.isEnabled ?? true,
    suppressionWindowMinutes: body.suppressionWindowMinutes,
    cooldownMinutes: body.cooldownMinutes,
    reopenDeltaThreshold: body.reopenDeltaThreshold,
    dedupeScope: body.dedupeScope,
    targetChannelType: body.targetChannelType ?? "AlertRouting",
    conditions: body.conditions.map((c) => ({
      metricType: c.metricType,
      operator: c.operator,
      thresholdValue: c.thresholdValue,
    })),
  });
}
