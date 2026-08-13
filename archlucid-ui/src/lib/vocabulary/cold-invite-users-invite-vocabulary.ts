/**
 * TB-2276 — Cold invite accept ≠ Users / invite-reviewer send vocabulary rail.
 *
 * Why two surfaces exist:
 * - Cold invite (`/auth/invite`) is the *recipient* handoff — validate a token
 *   and continue to sign in before joining the workspace.
 * - Users invite / Invite reviewer (`/administration/users` invite panel and
 *   `/administration/users/invite-reviewer`) is the *admin send* — email a
 *   workspace invitation with a role.
 *
 * They stay separate because accepting an invitation is not sending one.
 */

import { INVITE_REVIEWER_PATH } from "@/lib/invite-reviewer-flow";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

/** Canonical cold-invite accept path (pre-sign-in). */
export const AUTH_INVITE_PATH = "/auth/invite" as const;

export type ColdInviteUsersInviteSurfaceId = "cold-invite" | "users-invite";

export type ColdInviteUsersInviteLink = {
  readonly id: ColdInviteUsersInviteSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ColdInviteUsersInviteVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly coldInviteLink: ColdInviteUsersInviteLink;
  readonly usersInviteLink: ColdInviteUsersInviteLink;
};

export const COLD_INVITE_USERS_INVITE_HEADING =
  "Accepting an invitation and sending one serve different purposes" as const;

export const COLD_INVITE_USERS_INVITE_WHY_TWO =
  "Accept invitation validates a cold invite token and continues to sign in before joining the workspace. Users invite and Invite reviewer send a workspace invitation by email with a role. Accepting an invitation is not the same as inviting a reviewer or other member." as const;

export const COLD_INVITE_USERS_INVITE_COMPACT_LINE =
  "Accept invitation is the recipient handoff; Users invite sends invitations." as const;

export const COLD_INVITE_USERS_INVITE_COLD_LINK: ColdInviteUsersInviteLink = {
  id: "cold-invite",
  label: "Accept invitation",
  href: AUTH_INVITE_PATH,
  whenToUse: "Validate a cold invite token and continue to sign in.",
};

export const COLD_INVITE_USERS_INVITE_USERS_LINK: ColdInviteUsersInviteLink = {
  id: "users-invite",
  label: "Invite reviewer",
  href: INVITE_REVIEWER_PATH,
  whenToUse: "Send a workspace invitation with Reader or Auditor access.",
};

/** Alternate admin deep-link for the Users tab invite panel (same send task). */
export const COLD_INVITE_USERS_INVITE_USERS_TAB_HREF = SETTINGS_USERS_USERS_TAB_PATH;

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildColdInviteUsersInviteVocabulary(): ColdInviteUsersInviteVocabularyModel {
  return {
    heading: COLD_INVITE_USERS_INVITE_HEADING,
    whyTwo: COLD_INVITE_USERS_INVITE_WHY_TWO,
    compactLine: COLD_INVITE_USERS_INVITE_COMPACT_LINE,
    coldInviteLink: COLD_INVITE_USERS_INVITE_COLD_LINK,
    usersInviteLink: COLD_INVITE_USERS_INVITE_USERS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveColdInviteUsersInvitePeerLink(
  currentSurfaceId: ColdInviteUsersInviteSurfaceId,
): ColdInviteUsersInviteLink {
  if (currentSurfaceId === "cold-invite") {
    return COLD_INVITE_USERS_INVITE_USERS_LINK;
  }

  return COLD_INVITE_USERS_INVITE_COLD_LINK;
}
