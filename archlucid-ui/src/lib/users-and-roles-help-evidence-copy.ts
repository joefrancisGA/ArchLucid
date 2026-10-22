import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import { USERS_AND_ROLES_CONTRACT_VERSION } from "@/lib/users-and-roles-help-manifest";

/** Canon specialty path for users-and-roles help. */
export const USERS_AND_ROLES_HELP_CANONICAL_PATH = "/help/users-and-roles" as const;

export const USERS_AND_ROLES_HELP_TOPIC_LABEL = "How users and roles work" as const;

export const USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE =
  "This capability matrix describes built-in workspace roles for the current ArchLucid release — role orientation only, not a live report of who has access in your workspace.";

export const SECURENOW_USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE =
  "This capability matrix describes built-in SecureNow workspace roles for the current release — role orientation only, not a live report of who has access in your workspace.";

export const USERS_AND_ROLES_HELP_AS_OF_LABEL = "Built-in roles as of";

export const USERS_AND_ROLES_HELP_AS_OF_APPLICABILITY =
  `${USERS_AND_ROLES_CONTRACT_VERSION}. Custom roles can refine these defaults; open Users settings for live workspace membership.`;

export const USERS_AND_ROLES_HELP_SOURCES_INTRO =
  "Use these follow-ups when role vocabulary turns into live directory changes, audit trail review, or assurance orientation.";

export const SECURENOW_USERS_AND_ROLES_HELP_SOURCES_INTRO =
  "Use these follow-ups when role vocabulary turns into live directory changes, audit lineage review, or assurance orientation.";

export const USERS_AND_ROLES_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

/** Operator Sources — no self-href to users-and-roles. */
export const USERS_AND_ROLES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users settings", href: SETTINGS_USERS_USERS_TAB_PATH },
  { label: "Audit trail", href: inAppHelpHref("audit-trail") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;

export const SECURENOW_USERS_AND_ROLES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users settings", href: SETTINGS_USERS_USERS_TAB_PATH },
  { label: "Audit evidence lineage", href: SECURENOW_AUDIT_EVIDENCE_PATH },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;

export function resolveUsersAndRolesHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE
    : USERS_AND_ROLES_HELP_CLAIM_DISCIPLINE;
}

export function resolveUsersAndRolesHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_USERS_AND_ROLES_HELP_SOURCES_INTRO
    : USERS_AND_ROLES_HELP_SOURCES_INTRO;
}

export function resolveUsersAndRolesHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId) ? SECURENOW_USERS_AND_ROLES_HELP_SOURCES : USERS_AND_ROLES_HELP_SOURCES;
}
