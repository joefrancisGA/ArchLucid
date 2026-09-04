import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { USERS_AND_ROLES_CONTRACT_VERSION } from "@/lib/users-and-roles-help-manifest";

/** Canon specialty path for users-and-roles help. */
export const USERS_AND_ROLES_HELP_CANONICAL_PATH = "/help/users-and-roles" as const;

export const USERS_AND_ROLES_HELP_TOPIC_LABEL = "How users and roles work" as const;

export const USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE =
  "This capability matrix describes built-in workspace roles for the current ArchLucid release — role orientation only, not a live report of who has access in your workspace.";

export const USERS_AND_ROLES_HELP_AS_OF_LABEL = "Built-in roles as of";

export const USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY =
  `${USERS_AND_ROLES_CONTRACT_VERSION}. Custom roles can refine these defaults; open Users settings for live workspace membership.`;

export const USERS_AND_ROLES_HELP_SOURCES_INTRO =
  "Use these follow-ups when role vocabulary turns into live directory changes, audit trail review, or assurance orientation.";

export const USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

/** Operator Sources — no self-href to users-and-roles. */
export const USERS_AND_ROLES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users settings", href: SETTINGS_USERS_USERS_TAB_PATH },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;
