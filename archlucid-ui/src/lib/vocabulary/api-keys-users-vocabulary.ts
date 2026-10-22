/**
 * TB-2327 — API keys ≠ Users vocabulary rail.
 *
 * Why two surfaces exist:
 * - Host automation credentials (`/help/cli-usage`) are configured via deployment
 *   settings and CLI usage guidance — not in-product key rotation.
 * - Users (`/administration/users`) manage people, invitations, and roles.
 *
 * They stay separate because rotating a key is not the same as inviting a user
 * or assigning a role. Operators need both surfaces with deep links so they do
 * not treat credentials as membership (or the reverse).
 *
 * Promotes TB-2237 dual-router teaching into the shared VocabularyRail SoT layout.
 */

import {
  API_KEYS_SETTINGS_CANONICAL_PATH,
} from "@/lib/api-keys-settings-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ApiKeysUsersSurfaceId = "api-keys" | "users";

export type ApiKeysUsersLink = {
  readonly id: ApiKeysUsersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ApiKeysUsersVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly apiKeysLink: ApiKeysUsersLink;
  readonly usersLink: ApiKeysUsersLink;
};

export const API_KEYS_USERS_HEADING = "API keys and users stay separate" as const;

export const API_KEYS_USERS_WHY_TWO =
  "API keys are automation credentials for approved enterprise configurations. Users and roles manage people, invitations, and workspace access. Rotating a key does not invite a person — and inviting a user does not issue an API key." as const;

export const API_KEYS_USERS_COMPACT_LINE =
  "API keys rotate credentials; Users manage people and roles — open the other when you need both." as const;

export const API_KEYS_USERS_API_KEYS_LINK: ApiKeysUsersLink = {
  id: "api-keys",
  label: "CLI usage help",
  href: API_KEYS_SETTINGS_CANONICAL_PATH,
  whenToUse: "Configure host automation credentials and CLI access outside the Users directory.",
};

export const API_KEYS_USERS_USERS_LINK: ApiKeysUsersLink = {
  id: "users",
  label: "Users and roles",
  href: SETTINGS_USERS_PATH,
  whenToUse: "Invite people, assign roles, and manage workspace access.",
};

/** Pairwise model for API keys ↔ Users invite (fixed routes). */
export function buildApiKeysUsersPairwiseRail(): PairwiseVocabularyRailModel<ApiKeysUsersSurfaceId> {
  return {
    heading: API_KEYS_USERS_HEADING,
    whyTwo: API_KEYS_USERS_WHY_TWO,
    compactLine: API_KEYS_USERS_COMPACT_LINE,
    currentLink: API_KEYS_USERS_API_KEYS_LINK,
    peerLink: API_KEYS_USERS_USERS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildApiKeysUsersVocabulary(): ApiKeysUsersVocabularyModel {
  const rail = buildApiKeysUsersPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    apiKeysLink: rail.currentLink,
    usersLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveApiKeysUsersPeerLink(
  currentSurfaceId: ApiKeysUsersSurfaceId,
): ApiKeysUsersLink {
  if (currentSurfaceId === "api-keys") {
    return API_KEYS_USERS_USERS_LINK;
  }

  return API_KEYS_USERS_API_KEYS_LINK;
}
