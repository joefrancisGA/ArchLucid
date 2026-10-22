/**
 * TB-2320 — Webhooks ≠ API keys vocabulary rail.
 *
 * Why two surfaces exist:
 * - Webhooks (`/integrations/webhooks`) deliver selected ArchLucid events to a
 *   customer-managed HTTPS endpoint (outbound push).
 * - Host automation credentials (`/help/cli-usage`) cover inbound pull / machine
 *   auth via deployment settings — not the retired API keys settings page.
 *
 * They stay separate because configuring an outbound destination is not the
 * same as rotating a credential. Operators need both surfaces with deep links
 * so they do not treat event delivery as API authentication (or the reverse).
 *
 * Promotes TB-2242 dual-router teaching into the shared VocabularyRail SoT layout.
 */

import { API_KEYS_SETTINGS_CANONICAL_PATH } from "@/lib/api-keys-settings-evidence-copy";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";
import type { VocabularyPeerLinkFields } from "@/lib/vocabulary/vocabulary-peer-link-fields";

export type WebhooksApiKeysSurfaceId = "webhooks" | "api-keys";

export type WebhooksApiKeysLink = VocabularyPeerLinkFields & {
  readonly id: WebhooksApiKeysSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type WebhooksApiKeysVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly webhooksLink: WebhooksApiKeysLink;
  readonly apiKeysLink: WebhooksApiKeysLink;
};

export const WEBHOOKS_API_KEYS_HEADING = "Webhooks and API keys stay separate" as const;

export const WEBHOOKS_API_KEYS_WHY_TWO =
  "Webhooks push selected ArchLucid events to an HTTPS endpoint you manage. API keys are automation credentials for approved enterprise configurations. Configuring a destination is not the same as rotating a key." as const;

export const WEBHOOKS_API_KEYS_COMPACT_LINE =
  "Webhooks push events outbound; API keys rotate credentials — open the other when you need both." as const;

export const WEBHOOKS_API_KEYS_WEBHOOKS_LINK: WebhooksApiKeysLink = {
  id: "webhooks",
  label: "Webhooks",
  href: INTEGRATIONS_WEBHOOKS_PATH,
  whenToUse: "Deliver selected ArchLucid events to a secure HTTPS endpoint.",
};

export const WEBHOOKS_API_KEYS_API_KEYS_LINK: WebhooksApiKeysLink = {
  id: "api-keys",
  label: "CLI usage help",
  href: API_KEYS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Configure host automation credentials and CLI access for enterprise integrations.",
  compactLineAnchor: "API keys",
};

/** Pairwise model for Webhooks ↔ API keys (fixed routes). */
export function buildWebhooksApiKeysPairwiseRail(): PairwiseVocabularyRailModel<WebhooksApiKeysSurfaceId> {
  return {
    heading: WEBHOOKS_API_KEYS_HEADING,
    whyTwo: WEBHOOKS_API_KEYS_WHY_TWO,
    compactLine: WEBHOOKS_API_KEYS_COMPACT_LINE,
    currentLink: WEBHOOKS_API_KEYS_WEBHOOKS_LINK,
    peerLink: WEBHOOKS_API_KEYS_API_KEYS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildWebhooksApiKeysVocabulary(): WebhooksApiKeysVocabularyModel {
  const rail = buildWebhooksApiKeysPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    webhooksLink: rail.currentLink,
    apiKeysLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveWebhooksApiKeysPeerLink(
  currentSurfaceId: WebhooksApiKeysSurfaceId,
): WebhooksApiKeysLink {
  if (currentSurfaceId === "webhooks") {
    return WEBHOOKS_API_KEYS_API_KEYS_LINK;
  }

  return WEBHOOKS_API_KEYS_WEBHOOKS_LINK;
}
