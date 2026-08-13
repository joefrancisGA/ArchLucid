/**
 * TB-2262 — Custom roles ≠ Users people vocabulary rail.
 *
 * Why two tabs exist on Users and roles (`/administration/users`):
 * - Users and invitations manage people, pending invitations, and membership.
 * - Roles and permissions (custom roles matrix) define what authority each role
 *   grants — not the people list itself.
 *
 * They stay separate because inviting a person is not editing the roles matrix,
 * and changing a role’s permissions is not the same as assigning that role to
 * a member. Deep-link with `?tab=users` / `?tab=roles`.
 */

import {
  SETTINGS_USERS_ROLES_TAB_PATH,
  SETTINGS_USERS_USERS_TAB_PATH,
} from "@/lib/settings-admin-route-paths";

export type CustomRolesUsersSurfaceId = "custom-roles" | "users";

export type CustomRolesUsersLink = {
  readonly id: CustomRolesUsersSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type CustomRolesUsersVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly customRolesLink: CustomRolesUsersLink;
  readonly usersLink: CustomRolesUsersLink;
};

export const CUSTOM_ROLES_USERS_HEADING =
  "Custom roles and users people serve different purposes" as const;

export const CUSTOM_ROLES_USERS_WHY_TWO =
  "Users and invitations manage people, pending invitations, and workspace membership. Roles and permissions define what authority each role grants in the custom roles matrix. Inviting a person is not editing role permissions — and changing a role’s grants is not the same as assigning that role to a member." as const;

export const CUSTOM_ROLES_USERS_COMPACT_LINE =
  "Users manage people and invitations; Roles edit permissions — open the other tab when you need both." as const;

export const CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK: CustomRolesUsersLink = {
  id: "custom-roles",
  label: "Roles and permissions",
  href: SETTINGS_USERS_ROLES_TAB_PATH,
  whenToUse: "Edit the custom roles matrix and what authority each role grants.",
};

export const CUSTOM_ROLES_USERS_USERS_LINK: CustomRolesUsersLink = {
  id: "users",
  label: "Users and invitations",
  href: SETTINGS_USERS_USERS_TAB_PATH,
  whenToUse: "Invite people, review members, and manage pending invitations.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildCustomRolesUsersVocabulary(): CustomRolesUsersVocabularyModel {
  return {
    heading: CUSTOM_ROLES_USERS_HEADING,
    whyTwo: CUSTOM_ROLES_USERS_WHY_TWO,
    compactLine: CUSTOM_ROLES_USERS_COMPACT_LINE,
    customRolesLink: CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK,
    usersLink: CUSTOM_ROLES_USERS_USERS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveCustomRolesUsersPeerLink(
  currentSurfaceId: CustomRolesUsersSurfaceId,
): CustomRolesUsersLink {
  if (currentSurfaceId === "custom-roles") {
    return CUSTOM_ROLES_USERS_USERS_LINK;
  }

  return CUSTOM_ROLES_USERS_CUSTOM_ROLES_LINK;
}
