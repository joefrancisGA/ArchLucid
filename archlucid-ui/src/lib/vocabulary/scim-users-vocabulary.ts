/**
 * TB-2321 — SCIM provisioning ≠ Users invite vocabulary rail.
 *
 * Why two administration surfaces exist:
 * - SCIM provisioning (`/administration/scim-provisioning`) connects the IdP
 *   directory sync tokens and endpoint so people and groups flow in automatically.
 * - Users (`/administration/users`) invites people, assigns roles, and manages
 *   workspace membership by hand.
 *
 * They stay separate because issuing a SCIM token is not the same as inviting a
 * user or assigning a role. Operators need both surfaces with deep links so they
 * do not treat directory sync as membership management (or the reverse).
 *
 * Promotes TB-2259 dual-router teaching into the shared VocabularyRail SoT layout.
 */

import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export type UsersMembersDirectorySource = "scim_synced" | "manual";

export type UsersDirectorySourceStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export const USERS_DIRECTORY_SOURCE_SCIM_LABEL = "SCIM-synced directory" as const;

export const USERS_DIRECTORY_SOURCE_MANUAL_LABEL = "Manual invite directory" as const;

export type ScimUsersSurfaceId = "scim" | "users";

export type ScimUsersLink = {
  readonly id: ScimUsersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ScimUsersVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly scimLink: ScimUsersLink;
  readonly usersLink: ScimUsersLink;
};

export const SCIM_USERS_HEADING = "SCIM provisioning and users stay separate" as const;

export const SCIM_USERS_WHY_TWO =
  "SCIM provisioning connects your identity provider so people and groups sync into the workspace automatically. Users and roles manage invitations, membership, and workspace access by hand. Setting up automatic user sync (SCIM) is separate from manually inviting someone.";

export const SCIM_USERS_COMPACT_LINE =
  "SCIM syncs directory people; Users invite and assign roles — open the other when you need both." as const;

export const SCIM_USERS_SCIM_LINK: ScimUsersLink = {
  id: "scim",
  label: "SCIM provisioning",
  href: SCIM_PROVISIONING_CANONICAL_PATH,
  whenToUse: "Connect IdP directory sync tokens and verify automatic provisioning.",
};

export const SCIM_USERS_USERS_LINK: ScimUsersLink = {
  id: "users",
  label: "Users and roles",
  href: SETTINGS_USERS_PATH,
  whenToUse: "Invite people, assign roles, and manage workspace access.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildScimUsersVocabulary(): ScimUsersVocabularyModel {
  return {
    heading: SCIM_USERS_HEADING,
    whyTwo: SCIM_USERS_WHY_TWO,
    compactLine: SCIM_USERS_COMPACT_LINE,
    scimLink: SCIM_USERS_SCIM_LINK,
    usersLink: SCIM_USERS_USERS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveScimUsersPeerLink(currentSurfaceId: ScimUsersSurfaceId): ScimUsersLink {
  if (currentSurfaceId === "scim") {
    return SCIM_USERS_USERS_LINK;
  }

  return SCIM_USERS_SCIM_LINK;
}

/** True when at least one SCIM provisioning token is still active (not revoked). */
export function scimProvisioningActiveFromTokensPayload(json: unknown): boolean {
  if (json === null || typeof json !== "object") {
    return false;
  }

  const tokens = (json as { tokens?: unknown }).tokens;

  if (!Array.isArray(tokens)) {
    return false;
  }

  return tokens.some((entry) => {
    if (entry === null || typeof entry !== "object") {
      return false;
    }

    const revokedUtc = (entry as { revokedUtc?: unknown }).revokedUtc;

    return revokedUtc === null || revokedUtc === undefined || String(revokedUtc).length === 0;
  });
}

/** Members directory provenance for the Users administration surface. */
export function resolveUsersMembersDirectorySource(scimProvisioningActive: boolean): UsersMembersDirectorySource {
  if (scimProvisioningActive) {
    return "scim_synced";
  }

  return "manual";
}

/** StatusTag presentation for members directory source (SCIM-synced vs manual invite). */
export function usersDirectorySourceStatusTag(
  source: UsersMembersDirectorySource,
): UsersDirectorySourceStatusTag {
  if (source === "scim_synced") {
    return { kind: "ready", label: USERS_DIRECTORY_SOURCE_SCIM_LABEL };
  }

  return { kind: "draft", label: USERS_DIRECTORY_SOURCE_MANUAL_LABEL };
}
