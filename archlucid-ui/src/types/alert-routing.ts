import type { components } from "@/lib/openapi-schemas";

type AlertRoutingSubscriptionSchema = components["schemas"]["AlertRoutingSubscription"];

/** A subscription that routes fired alerts to a delivery channel (email, Slack, webhook, etc.). */
export type AlertRoutingSubscription = AlertRoutingSubscriptionSchema &
  Required<
    Pick<
      AlertRoutingSubscriptionSchema,
      | "routingSubscriptionId"
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "name"
      | "channelType"
      | "destination"
      | "minimumSeverity"
      | "isEnabled"
      | "createdUtc"
      | "metadataJson"
    >
  >;

/** Result of a synthetic ping dispatched to a webhook routing subscription destination. */
export type WebhookTestResponse = components["schemas"]["OutboundWebhookDryRunResponse"];

/** Record of a single attempt to deliver an alert to a routing subscription channel. */
export type AlertRoutingDeliveryAttempt = {
  alertDeliveryAttemptId: string;
  alertId: string;
  routingSubscriptionId: string;
  attemptedUtc: string;
  status: string;
  errorMessage?: string | null;
  channelType: string;
  destination: string;
  retryCount: number;
};
