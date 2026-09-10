/**
 * Customer-facing users-and-roles contract for `/help/users-and-roles`.
 * Built-in capability flags mirror `Permissions.BuiltIn*` in `ArchLucid.Core.Authorization.Permissions`.
 */
import {
  BUILTIN_ROLE_ORDER,
  BUILTIN_ROLE_SUMMARIES,
  type BuiltinRoleName,
} from "@/app/(operator)/administration/users/_sections/roles-matrix-constants";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  USERS_AND_ROLES_FAQ_HEADING,
  USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING,
  USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING,
  USERS_AND_ROLES_MANAGING_ACCESS_HEADING,
  USERS_AND_ROLES_REVIEW_PARTICIPATION_HEADING,
  USERS_AND_ROLES_ROLE_OVERVIEW_HEADING,
  USERS_AND_ROLES_SECURITY_GUIDANCE_HEADING,
  USERS_AND_ROLES_WORKSPACE_ACCESS_HEADING,
  usersAndRolesReviewParticipationHeading,
} from "@/lib/users-and-roles-help-copy";

export const USERS_AND_ROLES_CONTRACT_VERSION = "2026-07-13";

export type UsersAndRolesCapabilityId =
  | "view-reviews"
  | "create-reviews"
  | "finalize-reviews"
  | "finding-feedback"
  | "configure-governance"
  | "author-policy-packs"
  | "manage-integrations"
  | "manage-users"
  | "view-audit"
  | "export-audit"
  | "manage-billing";

export type UsersAndRolesRoleOverview = {
  readonly id: BuiltinRoleName;
  readonly label: string;
  readonly intendedUser: string;
  readonly summary: string;
  readonly restrictions: string;
};

export type UsersAndRolesCapabilityRow = {
  readonly id: UsersAndRolesCapabilityId;
  readonly label: string;
  readonly roles: Readonly<Record<BuiltinRoleName, boolean>>;
};

export type UsersAndRolesFaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export const USERS_AND_ROLES_MANAGE_HREF = SETTINGS_USERS_USERS_TAB_PATH;

export const USERS_AND_ROLES_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "how-access-works", title: USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING },
  { level: 2, id: "role-overview", title: USERS_AND_ROLES_ROLE_OVERVIEW_HEADING },
  { level: 2, id: "capability-matrix", title: USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING },
  { level: 2, id: "workspace-access", title: USERS_AND_ROLES_WORKSPACE_ACCESS_HEADING },
  { level: 2, id: "review-participation", title: USERS_AND_ROLES_REVIEW_PARTICIPATION_HEADING },
  { level: 2, id: "managing-access", title: USERS_AND_ROLES_MANAGING_ACCESS_HEADING },
  { level: 2, id: "security-guidance", title: USERS_AND_ROLES_SECURITY_GUIDANCE_HEADING },
  { level: 2, id: "common-questions", title: USERS_AND_ROLES_FAQ_HEADING },
];

export const USERS_AND_ROLES_SECURITY_TRUST_HREF = inAppHelpHref("security-trust");

export const USERS_AND_ROLES_SCOPE_GUIDE_HREF = inAppHelpHref("scope");

export const USERS_AND_ROLES_MANAGING_ACCESS_STEPS: readonly string[] = [
  "Open Users and roles in Settings.",
  "Invite a colleague or select an existing user.",
  "Choose the workspace role that matches their responsibilities.",
  "Save the change and confirm the user can sign in with the expected access.",
];

const BUILTIN_CAPABILITY_MATRIX: Readonly<Record<UsersAndRolesCapabilityId, Readonly<Record<BuiltinRoleName, boolean>>>> = {
  "view-reviews": { Admin: true, Operator: true, Reader: true, Auditor: true },
  "create-reviews": { Admin: true, Operator: true, Reader: false, Auditor: false },
  "finalize-reviews": { Admin: true, Operator: true, Reader: false, Auditor: false },
  "finding-feedback": { Admin: true, Operator: true, Reader: false, Auditor: false },
  "configure-governance": { Admin: true, Operator: false, Reader: false, Auditor: false },
  "author-policy-packs": { Admin: true, Operator: true, Reader: false, Auditor: false },
  "manage-integrations": { Admin: true, Operator: true, Reader: false, Auditor: false },
  "manage-users": { Admin: true, Operator: false, Reader: false, Auditor: false },
  "view-audit": { Admin: true, Operator: true, Reader: true, Auditor: true },
  "export-audit": { Admin: true, Operator: false, Reader: false, Auditor: true },
  "manage-billing": { Admin: true, Operator: false, Reader: false, Auditor: false },
};

const ROLE_RESTRICTIONS: Readonly<Record<BuiltinRoleName, string>> = {
  Admin: "Should be limited to people who manage workspace configuration, billing, and access.",
  Operator: "Cannot manage users, billing, or activate policy packs without administrator rights.",
  Reader: "Cannot create or finalize reviews, change evidence, or manage workspace settings.",
  Auditor: "Read-focused with audit export; cannot change reviews, evidence, or workspace settings.",
};

const SECURENOW_ROLE_RESTRICTIONS: Readonly<Record<BuiltinRoleName, string>> = {
  Admin: "Should be limited to people who manage workspace configuration, access, and integrations.",
  Operator: "Cannot manage users or activate policy packs without administrator rights.",
  Reader: "Cannot change findings disposition, connector configuration, or workspace settings.",
  Auditor: "Read-focused with audit export; cannot change packs, connectors, or workspace settings.",
};

const ROLE_INTENDED_USERS: Readonly<Record<BuiltinRoleName, string>> = {
  Admin: "Workspace administrator",
  Operator: "Architect running reviews",
  Reader: "Read-only reviewer or stakeholder",
  Auditor: "Compliance or audit reviewer",
};

const SECURENOW_ROLE_INTENDED_USERS: Readonly<Record<BuiltinRoleName, string>> = {
  Admin: "Workspace administrator",
  Operator: "Security operator on findings and inventory",
  Reader: "Read-only stakeholder for findings and lineage",
  Auditor: "Compliance or audit reviewer",
};

const SECURENOW_ROLE_SUMMARIES: Readonly<Record<BuiltinRoleName, string>> = {
  Admin: "Full workspace administration",
  Auditor: "Read and export audit evidence",
  Operator: "Operate on findings, inventory evidence, and policy packs",
  Reader: "Read-only access to findings, inventory, and audit lineage",
};

const SECURENOW_EXCLUDED_CAPABILITY_IDS: readonly UsersAndRolesCapabilityId[] = [
  "create-reviews",
  "finalize-reviews",
  "manage-billing",
];

export const USERS_AND_ROLES_CAPABILITY_LABELS: Readonly<Record<UsersAndRolesCapabilityId, string>> = {
  "view-reviews": "View architectures and reviews",
  "create-reviews": "Create architectures and start reviews",
  "finalize-reviews": "Finalize reviews",
  "finding-feedback": "Submit finding feedback",
  "configure-governance": "Activate policy packs",
  "author-policy-packs": "Author policy packs",
  "manage-integrations": "Configure integrations",
  "manage-users": "Manage users and roles",
  "view-audit": "View audit information",
  "export-audit": "Export audit trails",
  "manage-billing": "Manage billing",
};

function buildUsersAndRolesRoleOverview(productLineId: ProductLineId): readonly UsersAndRolesRoleOverview[] {
  const secureNow = isSecureNowProductLine(productLineId);

  return BUILTIN_ROLE_ORDER.map((roleId) => {
    const summary = BUILTIN_ROLE_SUMMARIES.find((entry) => entry.name === roleId);

    return {
      id: roleId,
      label: roleDisplayLabel(roleId),
      intendedUser: secureNow ? SECURENOW_ROLE_INTENDED_USERS[roleId] : ROLE_INTENDED_USERS[roleId],
      summary: secureNow ? SECURENOW_ROLE_SUMMARIES[roleId] : (summary?.description ?? ""),
      restrictions: secureNow ? SECURENOW_ROLE_RESTRICTIONS[roleId] : ROLE_RESTRICTIONS[roleId],
    };
  });
}

export const USERS_AND_ROLES_ROLE_OVERVIEW: readonly UsersAndRolesRoleOverview[] =
  buildUsersAndRolesRoleOverview("architecture");

function buildUsersAndRolesCapabilityRows(productLineId: ProductLineId): readonly UsersAndRolesCapabilityRow[] {
  const capabilityIds = Object.keys(BUILTIN_CAPABILITY_MATRIX) as UsersAndRolesCapabilityId[];
  const filteredIds = isSecureNowProductLine(productLineId)
    ? capabilityIds.filter((id) => !SECURENOW_EXCLUDED_CAPABILITY_IDS.includes(id))
    : capabilityIds;

  return filteredIds.map((id) => ({
    id,
    label: USERS_AND_ROLES_CAPABILITY_LABELS[id],
    roles: BUILTIN_CAPABILITY_MATRIX[id],
  }));
}

export const USERS_AND_ROLES_CAPABILITY_ROWS: readonly UsersAndRolesCapabilityRow[] =
  buildUsersAndRolesCapabilityRows("architecture");

export function usersAndRolesRoleOverview(
  productLineId: ProductLineId = "architecture",
): readonly UsersAndRolesRoleOverview[] {
  return buildUsersAndRolesRoleOverview(productLineId);
}

export function usersAndRolesCapabilityRows(
  productLineId: ProductLineId = "architecture",
): readonly UsersAndRolesCapabilityRow[] {
  return buildUsersAndRolesCapabilityRows(productLineId);
}

export function usersAndRolesGuideHeadings(productLineId: ProductLineId = "architecture"): readonly HelpMarkdownHeading[] {
  const participationHeading = usersAndRolesReviewParticipationHeading(productLineId);

  return USERS_AND_ROLES_GUIDE_HEADINGS.map((heading) =>
    heading.id === "review-participation" ? { ...heading, title: participationHeading } : heading,
  );
}

const ARCHITECTURE_USERS_AND_ROLES_FAQ: readonly UsersAndRolesFaqItem[] = [
  {
    id: "who-can-invite",
    question: "Who can invite users?",
    answer: "Workspace administrators can invite users and assign roles from Settings → Users and roles.",
  },
  {
    id: "single-project",
    question: "Can someone have access to only one project?",
    answer:
      "Workspace roles apply across the workspace. Project selection in the header changes what you are viewing, not who is allowed to sign in. Ask your administrator if you need a separate workspace for tighter isolation.",
  },
  {
    id: "admin-vs-operator",
    question: "What is the difference between an administrator and an architect?",
    answer:
      "Administrators manage users, billing, integrations, and policy activation. Architects run reviews, finalize architecture reviews, and configure policy packs without full workspace administration. Identity mappings may still use the claim value Operator for the Architect role.",
  },
  {
    id: "reviewer-invite",
    question: "How are reviewers invited?",
    answer:
      "Workspace administrators can open Invite reviewer from Settings to assign read-only review access, typically with the Reader role.",
  },
  {
    id: "billing",
    question: "Who can manage billing?",
    answer: "Only workspace administrators can change billing and subscription settings.",
  },
  {
    id: "request-access",
    question: "How do I request additional access?",
    answer: "Contact your workspace administrator or identity provider owner to request a role change.",
  },
];

const SECURENOW_USERS_AND_ROLES_FAQ: readonly UsersAndRolesFaqItem[] = [
  {
    id: "who-can-invite",
    question: "Who can invite users?",
    answer: "Workspace administrators can invite users and assign roles from Settings → Users and roles.",
  },
  {
    id: "single-project",
    question: "Can someone have access to only one project?",
    answer:
      "Workspace roles apply across the workspace. Project selection in the header changes what you are viewing, not who is allowed to sign in. Ask your administrator if you need a separate workspace for tighter isolation.",
  },
  {
    id: "admin-vs-operator",
    question: "What is the difference between an administrator and an architect?",
    answer:
      "Administrators manage users, integrations, SSO, and policy activation. Architects operate on findings, inventory evidence, and policy packs without full workspace administration. Identity mappings may still use the claim value Operator for the Architect role.",
  },
  {
    id: "reviewer-invite",
    question: "How are colleagues invited?",
    answer:
      "Workspace administrators can open Invite reviewer from Settings to assign Reader or Auditor access so colleagues can inspect findings and audit lineage.",
  },
  {
    id: "billing",
    question: "Who can manage billing?",
    answer:
      "Billing is not administered in SecureNow. Contact your workspace administrator or ArchLucid account owner for subscription questions.",
  },
  {
    id: "request-access",
    question: "How do I request additional access?",
    answer: "Contact your workspace administrator or identity provider owner to request a role change.",
  },
];

export const USERS_AND_ROLES_FAQ: readonly UsersAndRolesFaqItem[] = ARCHITECTURE_USERS_AND_ROLES_FAQ;

export function usersAndRolesFaq(productLineId: ProductLineId = "architecture"): readonly UsersAndRolesFaqItem[] {
  return isSecureNowProductLine(productLineId) ? SECURENOW_USERS_AND_ROLES_FAQ : ARCHITECTURE_USERS_AND_ROLES_FAQ;
}

export const USERS_AND_ROLES_BANNED_CUSTOMER_PATTERNS: readonly RegExp[] = [
  /\bJWT\b/i,
  /bearer token/i,
  /claim mapping/i,
  /appsettings/i,
  /DevelopmentBypass/i,
  /environment variable/i,
  /OpenAPI fuzzing/i,
  /OWASP ZAP/i,
  /docker/i,
  /rate-limit partition/i,
  /\bmiddleware\b/i,
  /SQL RLS/i,
  /break-glass/i,
  /ArchLucid\./,
  /LogSanitizer/i,
  /fail-open/i,
  /fail-closed/i,
];
