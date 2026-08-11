/**
 * TB-2237 — API keys ≠ Users dual-router.
 *
 * Why two administration surfaces exist:
 * - API keys (`/administration/api-keys`) manage automation credentials for
 *   approved enterprise configurations (rotate, overlap, audit).
 * - Users (`/administration/users`) manage people, invitations, and roles.
 *
 * They stay separate because rotating a key is not the same as inviting a user
 * or assigning a role. Operators need both surfaces with deep links so they do
 * not treat credentials as membership (or the reverse).
 */

import {
  API_KEYS_SETTINGS_CANONICAL_PATH,
} from "@/lib/api-keys-settings-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export type ApiKeysVsUsersSurfaceId = "api-keys" | "users";

export type ApiKeysVsUsersLink = {
  readonly id: ApiKeysVsUsersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ApiKeysVsUsersReconcilerModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly apiKeysLink: ApiKeysVsUsersLink;
  readonly usersLink: ApiKeysVsUsersLink;
};

export const API_KEYS_VS_USERS_HEADING = "API keys and users stay separate" as const;

export const API_KEYS_VS_USERS_WHY_TWO =
  "API keys are automation credentials for approved enterprise configurations. Users and roles manage people, invitations, and workspace access. Rotating a key does not invite a person — and inviting a user does not issue an API key. Open the peer link when you need the other job." as const;

export const API_KEYS_VS_USERS_COMPACT_LINE =
  "API keys rotate credentials; Users manage people and roles — open the other when you need both." as const;

export const API_KEYS_VS_USERS_API_KEYS_LINK: ApiKeysVsUsersLink = {
  id: "api-keys",
  label: "API keys",
  href: API_KEYS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Rotate or issue automation credentials for enterprise integrations.",
};

export const API_KEYS_VS_USERS_USERS_LINK: ApiKeysVsUsersLink = {
  id: "users",
  label: "Users and roles",
  href: SETTINGS_USERS_PATH,
  whenToUse: "Invite people, assign roles, and manage workspace access.",
};

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildApiKeysVsUsersReconciler(): ApiKeysVsUsersReconcilerModel {
  return {
    heading: API_KEYS_VS_USERS_HEADING,
    whyTwo: API_KEYS_VS_USERS_WHY_TWO,
    compactLine: API_KEYS_VS_USERS_COMPACT_LINE,
    apiKeysLink: API_KEYS_VS_USERS_API_KEYS_LINK,
    usersLink: API_KEYS_VS_USERS_USERS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveApiKeysVsUsersPeerLink(
  currentSurfaceId: ApiKeysVsUsersSurfaceId,
): ApiKeysVsUsersLink {
  if (currentSurfaceId === "api-keys") {
    return API_KEYS_VS_USERS_USERS_LINK;
  }

  return API_KEYS_VS_USERS_API_KEYS_LINK;
}
