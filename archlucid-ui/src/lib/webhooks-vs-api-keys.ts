/**
 * TB-2242 / TB-2320 — Webhooks ≠ API keys dual-router.
 *
 * Canonical vocabulary SoT lives in `@/lib/vocabulary/webhooks-api-keys-vocabulary`
 * (TB-2320 VocabularyRail). This module keeps the TB-2242 import surface.
 */

import {
  WEBHOOKS_API_KEYS_API_KEYS_LINK,
  WEBHOOKS_API_KEYS_COMPACT_LINE,
  WEBHOOKS_API_KEYS_HEADING,
  WEBHOOKS_API_KEYS_WEBHOOKS_LINK,
  WEBHOOKS_API_KEYS_WHY_TWO,
  buildWebhooksApiKeysVocabulary,
  resolveWebhooksApiKeysPeerLink,
  type WebhooksApiKeysLink,
  type WebhooksApiKeysSurfaceId,
  type WebhooksApiKeysVocabularyModel,
} from "@/lib/vocabulary/webhooks-api-keys-vocabulary";

export type WebhooksVsApiKeysSurfaceId = WebhooksApiKeysSurfaceId;

export type WebhooksVsApiKeysLink = WebhooksApiKeysLink;

export type WebhooksVsApiKeysReconcilerModel = WebhooksApiKeysVocabularyModel;

export const WEBHOOKS_VS_API_KEYS_HEADING = WEBHOOKS_API_KEYS_HEADING;

export const WEBHOOKS_VS_API_KEYS_WHY_TWO = WEBHOOKS_API_KEYS_WHY_TWO;

export const WEBHOOKS_VS_API_KEYS_COMPACT_LINE = WEBHOOKS_API_KEYS_COMPACT_LINE;

export const WEBHOOKS_VS_API_KEYS_WEBHOOKS_LINK = WEBHOOKS_API_KEYS_WEBHOOKS_LINK;

export const WEBHOOKS_VS_API_KEYS_API_KEYS_LINK = WEBHOOKS_API_KEYS_API_KEYS_LINK;

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildWebhooksVsApiKeysReconciler(): WebhooksVsApiKeysReconcilerModel {
  return buildWebhooksApiKeysVocabulary();
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveWebhooksVsApiKeysPeerLink(
  currentSurfaceId: WebhooksVsApiKeysSurfaceId,
): WebhooksVsApiKeysLink {
  return resolveWebhooksApiKeysPeerLink(currentSurfaceId);
}
