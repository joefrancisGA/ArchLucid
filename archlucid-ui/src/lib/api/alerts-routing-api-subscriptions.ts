import { ApiV1Routes } from "@/lib/api-v1-routes";
import type { AlertRoutingDeliveryAttempt, AlertRoutingSubscription, WebhookTestResponse } from "@/types/alert-routing";
import { apiGet, apiPostJson } from "./http";

function encodeRequiredSubscriptionId(value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error("routingSubscriptionId is required.");
  }

  return encodeURIComponent(normalized);
}

/** Lists all alert routing subscriptions (delivery channels for fired alerts). */
export async function listAlertRoutingSubscriptions(): Promise<AlertRoutingSubscription[]> {
  const raw = await apiGet<unknown>("/v1/alert-routing-subscriptions");

  return Array.isArray(raw)
    ? raw.filter((item): item is AlertRoutingSubscription =>
      item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
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
  const name = body.name.trim();
  const channelType = body.channelType.trim();
  const destination = body.destination.trim();
  const minimumSeverity = body.minimumSeverity.trim();

  if (name.length === 0 || channelType.length === 0 || destination.length === 0 || minimumSeverity.length === 0) {
    throw new Error("Routing subscription name, channel, destination, and severity are required.");
  }

  return apiPostJson<AlertRoutingSubscription>(`/${ApiV1Routes.alertRoutingSubscriptions}`, {
    name,
    channelType,
    destination,
    minimumSeverity,
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
    `/v1/alert-routing-subscriptions/${encodeRequiredSubscriptionId(routingSubscriptionId)}/toggle`,
    {},
  );
}

/** Lists delivery attempts for an alert routing subscription. */
export async function listAlertRoutingDeliveryAttempts(
  routingSubscriptionId: string,
  take = 30,
): Promise<AlertRoutingDeliveryAttempt[]> {
  const normalizedTake = Number.isFinite(take) && take >= 1 ? Math.floor(take) : 30;

  return apiGet<AlertRoutingDeliveryAttempt[]>(
    `/${ApiV1Routes.alertRoutingSubscriptions}/${encodeRequiredSubscriptionId(routingSubscriptionId)}/attempts?take=${normalizedTake}`,
  );
}

/** Sends a synthetic signed ping to a webhook routing subscription and returns the remote HTTP outcome. */
export async function testWebhookSubscription(routingSubscriptionId: string): Promise<WebhookTestResponse> {
  return apiPostJson<WebhookTestResponse>(
    `/${ApiV1Routes.webhookSubscriptions}/${encodeRequiredSubscriptionId(routingSubscriptionId)}/test`,
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
