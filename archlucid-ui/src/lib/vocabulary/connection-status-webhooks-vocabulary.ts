/**
 * TB-2301 — Integration readiness (Connection status) ≠ Webhooks vocabulary rail.
 *
 * Why two surfaces exist:
 * - Connection status (`/administration/connection-status`) summarizes which
 *   notification, ticketing, publishing, and outbound webhook integrations are
 *   ready for this workspace.
 * - Webhooks (`/integrations/webhooks`) edits webhook subscriptions and delivery
 *   destinations.
 *
 * They stay separate because readiness overview is not the subscription editor.
 * Distinct from Connection status ≠ Cloud connections (TB-2245) and Webhooks ≠
 * DLQ (TB-2239 family).
 */

import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  INTEGRATIONS_WEBHOOKS_PATH,
} from "@/lib/integrations-nav-paths";

export type ConnectionStatusWebhooksSurfaceId = "connection-status" | "webhooks";

export type ConnectionStatusWebhooksLink = {
  readonly id: ConnectionStatusWebhooksSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ConnectionStatusWebhooksVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly connectionStatusLink: ConnectionStatusWebhooksLink;
  readonly webhooksLink: ConnectionStatusWebhooksLink;
};

export const CONNECTION_STATUS_WEBHOOKS_HEADING =
  "Connection status and Webhooks do different jobs" as const;

export const CONNECTION_STATUS_WEBHOOKS_WHY_TWO =
  "Connection status shows which notification, ticketing, publishing, and outbound webhook integrations are ready for this workspace. Webhooks edits webhook subscriptions and delivery destinations. Checking readiness does not configure subscriptions." as const;

export const CONNECTION_STATUS_WEBHOOKS_COMPACT_LINE =
  "Connection status is integration readiness; Webhooks edits subscriptions — open the other when you need that job." as const;

export const CONNECTION_STATUS_WEBHOOKS_STATUS_LINK: ConnectionStatusWebhooksLink = {
  id: "connection-status",
  label: "Connection status",
  href: ADMINISTRATION_CONNECTION_STATUS_PATH,
  whenToUse: "See which workspace integrations are ready, recommended, or optional.",
};

export const CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK: ConnectionStatusWebhooksLink = {
  id: "webhooks",
  label: "Webhooks",
  href: INTEGRATIONS_WEBHOOKS_PATH,
  whenToUse: "Configure webhook subscriptions and delivery destinations.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildConnectionStatusWebhooksVocabulary(): ConnectionStatusWebhooksVocabularyModel {
  return {
    heading: CONNECTION_STATUS_WEBHOOKS_HEADING,
    whyTwo: CONNECTION_STATUS_WEBHOOKS_WHY_TWO,
    compactLine: CONNECTION_STATUS_WEBHOOKS_COMPACT_LINE,
    connectionStatusLink: CONNECTION_STATUS_WEBHOOKS_STATUS_LINK,
    webhooksLink: CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveConnectionStatusWebhooksPeerLink(
  currentSurfaceId: ConnectionStatusWebhooksSurfaceId,
): ConnectionStatusWebhooksLink {
  if (currentSurfaceId === "connection-status") {
    return CONNECTION_STATUS_WEBHOOKS_WEBHOOKS_LINK;
  }

  return CONNECTION_STATUS_WEBHOOKS_STATUS_LINK;
}
