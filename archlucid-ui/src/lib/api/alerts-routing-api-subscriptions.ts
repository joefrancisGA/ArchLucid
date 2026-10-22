import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";
import { apiGet, apiPostJson } from "./http";

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

export type OutboundWebhookDryRunRequestBody = {
  targetUrl: string;
  sharedSecret?: string | null;
};

/** Probes a webhook URL without persisting a subscription (POST `/v1/webhooks/dry-run`). */
export async function dryRunOutboundWebhook(body: OutboundWebhookDryRunRequestBody): Promise<WebhookTestResponse> {
  const payload: OutboundWebhookDryRunRequestBody = {
    targetUrl: body.targetUrl.trim(),
  };

  const trimmedSecret = body.sharedSecret?.trim() ?? "";

  if (trimmedSecret.length > 0) {
    payload.sharedSecret = trimmedSecret;
  }

  return apiPostJson<WebhookTestResponse>("/v1/webhooks/dry-run", payload);
}

/** @deprecated Prefer {@link testWebhookSubscription}. */
export async function testIntegrationWebhook(routingSubscriptionId: string): Promise<WebhookTestResponse> {
  return testWebhookSubscription(routingSubscriptionId);
}
