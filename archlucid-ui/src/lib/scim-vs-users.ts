/**
 * TB-2259 / TB-2321 — SCIM provisioning ≠ Users dual-router.
 *
 * Canonical vocabulary SoT lives in `@/lib/vocabulary/scim-users-vocabulary`
 * (TB-2321 VocabularyRail). This module keeps the TB-2259 import surface.
 */

import {
  SCIM_USERS_COMPACT_LINE,
  SCIM_USERS_HEADING,
  SCIM_USERS_SCIM_LINK,
  SCIM_USERS_USERS_LINK,
  SCIM_USERS_WHY_TWO,
  buildScimUsersVocabulary,
  resolveScimUsersPeerLink,
  type ScimUsersLink,
  type ScimUsersSurfaceId,
  type ScimUsersVocabularyModel,
} from "@/lib/vocabulary/scim-users-vocabulary";

export type ScimVsUsersSurfaceId = ScimUsersSurfaceId;

export type ScimVsUsersLink = ScimUsersLink;

export type ScimVsUsersReconcilerModel = ScimUsersVocabularyModel;

export const SCIM_VS_USERS_HEADING = SCIM_USERS_HEADING;

export const SCIM_VS_USERS_WHY_TWO = SCIM_USERS_WHY_TWO;

export const SCIM_VS_USERS_COMPACT_LINE = SCIM_USERS_COMPACT_LINE;

export const SCIM_VS_USERS_SCIM_LINK = SCIM_USERS_SCIM_LINK;

export const SCIM_VS_USERS_USERS_LINK = SCIM_USERS_USERS_LINK;

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildScimVsUsersReconciler(): ScimVsUsersReconcilerModel {
  return buildScimUsersVocabulary();
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveScimVsUsersPeerLink(
  currentSurfaceId: ScimVsUsersSurfaceId,
): ScimVsUsersLink {
  return resolveScimUsersPeerLink(currentSurfaceId);
}
