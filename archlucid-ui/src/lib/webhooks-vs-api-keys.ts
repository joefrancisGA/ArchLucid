/**
 * TB-2242 — Webhooks ≠ API keys dual-router.
 *
 * Why two surfaces exist:
 * - Webhooks (`/integrations/webhooks`) deliver selected ArchLucid events to a
 *   customer-managed HTTPS endpoint (outbound push).
 * - API keys (`/administration/api-keys`) manage automation credentials for
 *   approved enterprise configurations (inbound pull / machine auth).
 *
 * They stay separate because configuring an outbound destination is not the
 * same as rotating a credential. Operators need both surfaces with deep links
 * so they do not treat event delivery as API authentication (or the reverse).
 */

import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";

export type WebhooksVsApiKeysSurfaceId = "webhooks" | "api-keys";

export type WebhooksVsApiKeysLink = {
  readonly id: WebhooksVsApiKeysSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type WebhooksVsApiKeysReconcilerModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly webhooksLink: WebhooksVsApiKeysLink;
  readonly apiKeysLink: WebhooksVsApiKeysLink;
};

export const WEBHOOKS_VS_API_KEYS_HEADING = "Webhooks and API keys stay separate" as const;

export const WEBHOOKS_VS_API_KEYS_WHY_TWO =
  "Webhooks push selected ArchLucid events to an HTTPS endpoint you manage. API keys are automation credentials for approved enterprise configurations. Configuring a destination is not the same as rotating a key — open the peer link when you need the other job." as const;

export const WEBHOOKS_VS_API_KEYS_COMPACT_LINE =
  "Webhooks push events outbound; API keys rotate credentials — open the other when you need both." as const;

export const WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK: WebhooksVsApiKeysLink = {
  id: "webhooks",
  label: "Webhooks",
  href: INTEGRATIONS_WEBHOOKS_PATH,
  whenToUse: "Deliver selected ArchLucid events to a secure HTTPS endpoint.",
};

export const WEBHOOKS_VS_API_KEYS_API_KEYS_LINK: WebhooksVsApiKeysLink = {
  id: "api-keys",
  label: "API keys",
  href: API_KEYS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Rotate or issue automation credentials for enterprise integrations.",
};

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildWebhooksVsApiKeysReconciler(): WebhooksVsApiKeysReconcilerModel {
  return {
    heading: WEBHOOKS_VS_API_KEYS_HEADING,
    whyTwo: WEBHOOKS_VS_API_KEYS_WHY_TWO,
    compactLine: WEBHOOKS_VS_API_KEYS_COMPACT_LINE,
    webhooksLink: WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK,
    apiKeysLink: WEBHOOKS_VS_API_KEYS_API_KEYS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveWebhooksVsApiKeysPeerLink(
  currentSurfaceId: WebhooksVsApiKeysSurfaceId,
): WebhooksVsApiKeysLink {
  if (currentSurfaceId === "webhooks") {
    return WEBHOOKS_VS_API_KEYS_API_KEYS_LINK;
  }

  return WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK;
}
