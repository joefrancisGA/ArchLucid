import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

/** Canon specialty path (HOE alias `/help/operator-auth-roles` resolves here). */
export const USERS_AND_ROLES_HELP_CANONICAL_PATH = "/help/users-and-roles" as const;

export const OPERATOR_AUTH_ROLES_HELP_ALIAS_PATH = "/help/operator-auth-roles" as const;

export const USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE =
  "This users-and-roles guide explains ArchLucid app roles and capabilities — it is operator access orientation, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or the live Users settings when you need assurance trails or directory changes.";

export const USERS_AND_ROLES_HELP_SOURCES_INTRO =
  "Use these follow-ups when role vocabulary turns into inviting teammates, adjusting workspace access, or citing assurance orientation.";

export type UsersAndRolesHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to users-and-roles or operator-auth-roles alias. */
export const USERS_AND_ROLES_HELP_SOURCES: readonly UsersAndRolesHelpSourceLink[] = [
  { label: "Users settings", href: SETTINGS_USERS_USERS_TAB_PATH },
  { label: "Invite a reviewer", href: "/administration/users/invite-reviewer" },
  { label: "Scope guide", href: inAppHelpHref("scope") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
