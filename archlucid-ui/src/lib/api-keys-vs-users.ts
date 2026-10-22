/**
 * TB-2237 / TB-2327 — API keys ≠ Users dual-router.
 *
 * Canonical vocabulary SoT lives in `@/lib/vocabulary/api-keys-users-vocabulary`
 * (TB-2327 VocabularyRail). This module keeps the TB-2237 import surface.
 */

import {
  API_KEYS_USERS_API_KEYS_LINK,
  API_KEYS_USERS_COMPACT_LINE,
  API_KEYS_USERS_HEADING,
  API_KEYS_USERS_USERS_LINK,
  API_KEYS_USERS_WHY_TWO,
  buildApiKeysUsersVocabulary,
  resolveApiKeysUsersPeerLink,
  type ApiKeysUsersLink,
  type ApiKeysUsersSurfaceId,
  type ApiKeysUsersVocabularyModel,
} from "@/lib/vocabulary/api-keys-users-vocabulary";

export type ApiKeysVsUsersSurfaceId = ApiKeysUsersSurfaceId;

export type ApiKeysVsUsersLink = ApiKeysUsersLink;

export type ApiKeysVsUsersReconcilerModel = ApiKeysUsersVocabularyModel;

export const API_KEYS_VS_USERS_HEADING = API_KEYS_USERS_HEADING;

export const API_KEYS_VS_USERS_WHY_TWO = API_KEYS_USERS_WHY_TWO;

export const API_KEYS_VS_USERS_COMPACT_LINE = API_KEYS_USERS_COMPACT_LINE;

export const API_KEYS_VS_USERS_API_KEYS_LINK = API_KEYS_USERS_API_KEYS_LINK;

export const API_KEYS_VS_USERS_USERS_LINK = API_KEYS_USERS_USERS_LINK;

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildApiKeysVsUsersReconciler(): ApiKeysVsUsersReconcilerModel {
  return buildApiKeysUsersVocabulary();
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveApiKeysVsUsersPeerLink(
  currentSurfaceId: ApiKeysVsUsersSurfaceId,
): ApiKeysVsUsersLink {
  return resolveApiKeysUsersPeerLink(currentSurfaceId);
}
