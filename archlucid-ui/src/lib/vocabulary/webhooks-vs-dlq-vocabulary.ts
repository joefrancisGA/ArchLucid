/**
 * TB-2264 — Webhooks ≠ integration-events DLQ vocabulary rail.
 *
 * Why two surfaces exist:
 * - Webhooks (`/integrations/webhooks`) configure *outbound delivery* —
 *   destination URLs, events, and signing for customer webhook subscriptions.
 * - Integration event dead letters (`/internal/failed-integration-messages`) are the
 *   *ops recovery* queue for outbound integration events that exhausted publish
 *   retries and need inspect / retry / suppress.
 *
 * They stay separate because configuring a webhook destination is not the same
 * task as reclaiming failed outbox rows after a publish outage.
 */

import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";

export type WebhooksVsDlqSurfaceId = "webhooks" | "dlq";

export type WebhooksVsDlqLink = {
  readonly id: WebhooksVsDlqSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type WebhooksVsDlqVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly webhooksLink: WebhooksVsDlqLink;
  readonly dlqLink: WebhooksVsDlqLink;
};

export const WEBHOOKS_VS_DLQ_HEADING =
  "Webhooks and dead letters serve different purposes" as const;

export const WEBHOOKS_VS_DLQ_WHY_TWO =
  "Webhooks send events to your destination URLs when subscribed events occur. Integration event dead letters retry events that failed to send after multiple attempts. Setting up a webhook is not the same as retrying a failed delivery." as const;

export const WEBHOOKS_VS_DLQ_COMPACT_LINE =
  "Webhooks send outbound events; dead letters retry failed deliveries — open the other when you need both." as const;

export const WEBHOOKS_VS_DLQ_WEBHOOKS_LINK: WebhooksVsDlqLink = {
  id: "webhooks",
  label: "Webhooks",
  href: INTEGRATIONS_WEBHOOKS_PATH,
  whenToUse: "Create or update outbound webhook subscriptions and destination URLs.",
};

export const WEBHOOKS_VS_DLQ_DLQ_LINK: WebhooksVsDlqLink = {
  id: "dlq",
  label: "Integration event dead letters",
  href: INTERNAL_INTEGRATION_EVENTS_DLQ_PATH,
  whenToUse: "Inspect, retry, or suppress outbound integration events that exhausted publish retries.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildWebhooksVsDlqVocabulary(): WebhooksVsDlqVocabularyModel {
  return {
    heading: WEBHOOKS_VS_DLQ_HEADING,
    whyTwo: WEBHOOKS_VS_DLQ_WHY_TWO,
    compactLine: WEBHOOKS_VS_DLQ_COMPACT_LINE,
    webhooksLink: WEBHOOKS_VS_DLQ_WEBHOOKS_LINK,
    dlqLink: WEBHOOKS_VS_DLQ_DLQ_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveWebhooksVsDlqPeerLink(
  currentSurfaceId: WebhooksVsDlqSurfaceId,
): WebhooksVsDlqLink {
  if (currentSurfaceId === "webhooks") {
    return WEBHOOKS_VS_DLQ_DLQ_LINK;
  }

  return WEBHOOKS_VS_DLQ_WEBHOOKS_LINK;
}
