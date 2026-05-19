import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { AlertRecord, AlertRule } from "@/types/alerts";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";
import type { CompositeAlertRule } from "@/types/composite-alert-rules";
import type { RuleCandidateComparisonResult, RuleSimulationResult } from "@/types/alert-simulation";
import type { ThresholdRecommendationResult } from "@/types/alert-tuning";
import type { PagedResponse } from "@/types/pagination";
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

/** Lists alert records, optionally filtered by status (Active, Acknowledged, Resolved, Suppressed). */
export async function listAlerts(status: string | null, take = 100): Promise<AlertRecord[]> {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  q.set("take", String(take));
  const suffix = q.toString();
  return apiGet<AlertRecord[]>(`/v1/alerts${suffix ? `?${suffix}` : ""}`);
}

/** Paged alerts (GET with `page` + `pageSize` — returns PagedResponse). */
export async function listAlertsPaged(
  status: string | null,
  page: number,
  pageSize: number,
): Promise<PagedResponse<AlertRecord>> {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  q.set("page", String(page));
  q.set("pageSize", String(pageSize));

  return apiGet<PagedResponse<AlertRecord>>(`/v1/alerts?${q}`);
}

export async function applyAlertAction(
  alertId: string,
  action: "Acknowledge" | "Resolve" | "Suppress",
  comment?: string,
): Promise<AlertRecord> {
  return apiPostJson<AlertRecord>(`/${ApiV1Routes.alerts}/${encodeURIComponent(alertId)}/action`, {
    action,
    comment: comment ?? "",
  });
}

/** Lists all alert routing subscriptions (delivery channels for fired alerts). */
export async function listAlertRoutingSubscriptions(): Promise<AlertRoutingSubscription[]> {
  return apiGet<AlertRoutingSubscription[]>("/v1/alert-routing-subscriptions");
}

export type AlertRoutingCriteriaInput = {
  severities?: string[];
  findingTypes?: string[];
  tags?: string[];
};

/** Creates a new alert routing subscription (channel + severity filter + optional routing criteria). */
export async function createAlertRoutingSubscription(body: {
  name: string;
  channelType: string;
  destination: string;
  minimumSeverity: string;
  isEnabled?: boolean;
  metadataJson?: string;
  routingCriteria?: AlertRoutingCriteriaInput;
}): Promise<AlertRoutingSubscription> {
  return apiPostJson<AlertRoutingSubscription>(`/${ApiV1Routes.alertRoutingSubscriptions}`, {
    name: body.name,
    channelType: body.channelType,
    destination: body.destination,
    minimumSeverity: body.minimumSeverity,
    isEnabled: body.isEnabled ?? true,
    metadataJson: body.metadataJson ?? "{}",
    routingCriteria: body.routingCriteria,
  });
}

/** Toggles an alert routing subscription between enabled and disabled. */
export async function toggleAlertRoutingSubscription(
  routingSubscriptionId: string,
): Promise<AlertRoutingSubscription> {
  return apiPostJson<AlertRoutingSubscription>(
    `/v1/alert-routing-subscriptions/${encodeURIComponent(routingSubscriptionId)}/toggle`,
    {},
  );
}

/** Lists delivery attempts for an alert routing subscription. */
export async function listAlertRoutingDeliveryAttempts(
  routingSubscriptionId: string,
  take = 30,
): Promise<AlertRoutingDeliveryAttempt[]> {
  return apiGet<AlertRoutingDeliveryAttempt[]>(
    `/${ApiV1Routes.alertRoutingSubscriptions}/${encodeURIComponent(routingSubscriptionId)}/attempts?take=${take}`,
  );
}

/** Sends a synthetic signed ping to a webhook routing subscription and returns the remote HTTP outcome. */
export async function testWebhookSubscription(routingSubscriptionId: string): Promise<WebhookTestResponse> {
  return apiPostJson<WebhookTestResponse>(
    `/${ApiV1Routes.webhookSubscriptions}/${encodeURIComponent(routingSubscriptionId)}/test`,
    {},
  );
}

/** @deprecated Prefer {@link testWebhookSubscription}. */
export async function testIntegrationWebhook(routingSubscriptionId: string): Promise<WebhookTestResponse> {
  return testWebhookSubscription(routingSubscriptionId);
}


export async function listCompositeAlertRules(): Promise<CompositeAlertRule[]> {
  return apiGet<CompositeAlertRule[]>(`/${ApiV1Routes.compositeAlertRules}`);
}

/** POST `/${ApiV1Routes.alertSimulation}/simulate`: preview firing against recent architecture reviews. */
export type SimulateAlertRuleRequestBody = {
  ruleKind: string;
  simpleRule?: Record<string, unknown> | null;
  compositeRule?: Record<string, unknown> | null;
  runId?: string | null;
  comparedToRunId?: string | null;
  recentRunCount?: number;
  useHistoricalWindow?: boolean;
  runProjectSlug?: string;
};

/** Simulates an alert rule against recent runs to preview what alerts would fire. */
export async function simulateAlertRule(body: SimulateAlertRuleRequestBody): Promise<RuleSimulationResult> {
  return apiPostJson<RuleSimulationResult>(`/${ApiV1Routes.alertSimulation}/simulate`, body);
}


export async function recommendAlertThreshold(body: {
  ruleKind: string;
  tunedMetricType: string;
  candidateThresholds: number[];
  recentRunCount?: number;
  targetCreatedAlertCountMin?: number;
  targetCreatedAlertCountMax?: number;
  runProjectSlug?: string;
  baseSimpleRule?: Record<string, unknown> | null;
  baseCompositeRule?: Record<string, unknown> | null;
}): Promise<ThresholdRecommendationResult> {
  return apiPostJson<ThresholdRecommendationResult>("/v1/alert-tuning/recommend-threshold", body);
}

/** Compares two alert rule candidates side-by-side using simulation. */
export async function compareAlertRuleCandidates(body: {
  ruleKind: string;
  candidateA_SimpleRule?: Record<string, unknown> | null;
  candidateB_SimpleRule?: Record<string, unknown> | null;
  candidateA_CompositeRule?: Record<string, unknown> | null;
  candidateB_CompositeRule?: Record<string, unknown> | null;
  recentRunCount?: number;
  runProjectSlug?: string;
}): Promise<RuleCandidateComparisonResult> {
  return apiPostJson<RuleCandidateComparisonResult>(
    `/${ApiV1Routes.alertSimulation}/compare-candidates`,
    body,
  );
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
