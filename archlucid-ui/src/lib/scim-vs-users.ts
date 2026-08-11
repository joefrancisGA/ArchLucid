/**
 * TB-2259 — SCIM provisioning ≠ Users dual-router.
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
 */

import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";
import { SETTINGS_USERS_PATH } from "@/lib/settings-admin-route-paths";

export type ScimVsUsersSurfaceId = "scim" | "users";

export type ScimVsUsersLink = {
  readonly id: ScimVsUsersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ScimVsUsersReconcilerModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly scimLink: ScimVsUsersLink;
  readonly usersLink: ScimVsUsersLink;
};

export const SCIM_VS_USERS_HEADING = "SCIM provisioning and users stay separate" as const;

export const SCIM_VS_USERS_WHY_TWO =
  "SCIM provisioning connects your identity provider so people and groups sync into the workspace automatically. Users and roles manage invitations, membership, and workspace access by hand. Issuing a SCIM token does not invite a person — and inviting a user does not configure directory sync. Open the peer link when you need the other job." as const;

export const SCIM_VS_USERS_COMPACT_LINE =
  "SCIM syncs directory people; Users invite and assign roles — open the other when you need both." as const;

export const SCIM_VS_USERS_SCIM_LINK: ScimVsUsersLink = {
  id: "scim",
  label: "SCIM provisioning",
  href: SCIM_PROVISIONING_CANONICAL_PATH,
  whenToUse: "Connect IdP directory sync tokens and verify automatic provisioning.",
};

export const SCIM_VS_USERS_USERS_LINK: ScimVsUsersLink = {
  id: "users",
  label: "Users and roles",
  href: SETTINGS_USERS_PATH,
  whenToUse: "Invite people, assign roles, and manage workspace access.",
};

/** Full reconciler model (heading, why-two copy, and deep links). */
export function buildScimVsUsersReconciler(): ScimVsUsersReconcilerModel {
  return {
    heading: SCIM_VS_USERS_HEADING,
    whyTwo: SCIM_VS_USERS_WHY_TWO,
    compactLine: SCIM_VS_USERS_COMPACT_LINE,
    scimLink: SCIM_VS_USERS_SCIM_LINK,
    usersLink: SCIM_VS_USERS_USERS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveScimVsUsersPeerLink(
  currentSurfaceId: ScimVsUsersSurfaceId,
): ScimVsUsersLink {
  if (currentSurfaceId === "scim") {
    return SCIM_VS_USERS_USERS_LINK;
  }

  return SCIM_VS_USERS_SCIM_LINK;
}
