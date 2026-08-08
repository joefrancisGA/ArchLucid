import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

/** Canon specialty path for users-and-roles help. */
export const USERS_AND_ROLES_HELP_CANONICAL_PATH = "/help/users-and-roles" as const;

export const USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE =
  "This users-and-roles guide explains ArchLucid app roles and capabilities — it is operator access orientation, not a signed-review diligence Sources package. Open Assurance status or the live Users settings when you need assurance trails or directory changes.";

export const USERS_AND_ROLES_HELP_SOURCES_INTRO =
  "Use these follow-ups when role vocabulary turns into inviting teammates, adjusting workspace access, or citing assurance orientation.";

export type UsersAndRolesHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to users-and-roles. */
export const USERS_AND_ROLES_HELP_SOURCES: readonly UsersAndRolesHelpSourceLink[] = [
  { label: "Users settings", href: SETTINGS_USERS_USERS_TAB_PATH },
  { label: "Invite a reviewer", href: "/administration/users/invite-reviewer" },
  { label: "Scope guide", href: inAppHelpHref("scope") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
