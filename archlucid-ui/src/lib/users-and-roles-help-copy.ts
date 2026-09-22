import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const USERS_AND_ROLES_PAGE_TITLE = "Users and roles";

export const USERS_AND_ROLES_PAGE_INTRO =
  "Understand ArchLucid roles, who can manage access, and how permissions apply across your workspace.";

export const USERS_AND_ROLES_MANAGE_ACTION_LABEL = "Manage users and roles";

export const USERS_AND_ROLES_UNAUTHORIZED_BODY =
  "Contact your workspace administrator to invite users or change roles.";

export const USERS_AND_ROLES_AUTHORITY_LOADING_LABEL = "Checking your access…";

export const USERS_AND_ROLES_UNAUTHORIZED_NEXT_STEP_LABEL = "Review built-in roles";

export const USERS_AND_ROLES_ROLE_OVERVIEW_HASH = "#role-overview";

export const USERS_AND_ROLES_HOW_ACCESS_WORKS_HEADING = "How access works";

export const USERS_AND_ROLES_HOW_ACCESS_WORKS_BODY =
  "People sign in to your tenant and work inside a workspace. Roles control what each person can view and change. Some actions, such as inviting users or managing billing, require administrator permission. Assign the least access needed for each responsibility.";

export const USERS_AND_ROLES_ROLE_OVERVIEW_HEADING = "Role overview";

export const USERS_AND_ROLES_CAPABILITY_MATRIX_HEADING = "What each role can do";

export const USERS_AND_ROLES_CAPABILITY_MATRIX_CAPTION =
  "Summary of built-in workspace roles. Custom roles can refine these defaults.";

export const USERS_AND_ROLES_WORKSPACE_ACCESS_HEADING = "Workspace access";

export const USERS_AND_ROLES_WORKSPACE_ACCESS_BODY =
  "Workspace roles apply across the active workspace. The scope switcher in the header changes which workspace and project you are viewing; it does not grant access by itself. Tenant name and workspace assignment are managed by administrators or your identity provider.";

export const USERS_AND_ROLES_REVIEW_PARTICIPATION_HEADING = "Review participation";

export const USERS_AND_ROLES_REVIEW_PARTICIPATION_BODY =
  "Workspace administrators can invite reviewers from Settings. Invited colleagues can accept with a one-time email code or a work or school account when your tenant allows it. Reviewer invitations typically assign the Reader role so colleagues can view reviews, findings, and approval decisions without changing evidence or finalizing reviews.";

export const USERS_AND_ROLES_MANAGING_ACCESS_HEADING = "Managing access";

export const USERS_AND_ROLES_SECURITY_GUIDANCE_HEADING = "Security guidance";

export const USERS_AND_ROLES_SECURITY_GUIDANCE_ITEMS = [
  "Assign the least access required for each person.",
  "Review workspace membership periodically.",
  "Remove access when responsibilities change.",
  "Use audit history to review administrative changes where available.",
] as const;

export const USERS_AND_ROLES_SECURITY_TRUST_LINK_LABEL = "Security and trust";

export const USERS_AND_ROLES_FAQ_HEADING = "Common questions";

export const USERS_AND_ROLES_SCOPE_GUIDE_LINK_LABEL = "Workspace and scope guide";

export const SECURENOW_USERS_AND_ROLES_PAGE_INTRO =
  "Understand SecureNow workspace roles, who can manage access, and how permissions apply across findings, packs, and inventory work.";

export const SECURENOW_USERS_AND_ROLES_HOW_ACCESS_WORKS_BODY =
  "People sign in to your tenant and work inside a workspace. Roles control what each person can view and change in SecureNow. Some actions, such as inviting users or configuring SSO, require administrator permission. Assign the least access needed for each responsibility.";

export const SECURENOW_USERS_AND_ROLES_WORKSPACE_PARTICIPATION_HEADING = "Workspace participation";

export const SECURENOW_USERS_AND_ROLES_WORKSPACE_PARTICIPATION_BODY =
  "Workspace administrators can invite colleagues from Settings. Invited users can accept with a one-time email code or a work or school account when your tenant allows it. Reader and Auditor roles let colleagues inspect findings, inventory evidence, and audit lineage without changing connector configuration or pack assignments.";

export function usersAndRolesPageIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId) ? SECURENOW_USERS_AND_ROLES_PAGE_INTRO : USERS_AND_ROLES_PAGE_INTRO;
}

export function usersAndRolesHowAccessWorksBody(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_USERS_AND_ROLES_HOW_ACCESS_WORKS_BODY
    : USERS_AND_ROLES_HOW_ACCESS_WORKS_BODY;
}

export function usersAndRolesReviewParticipationHeading(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_USERS_AND_ROLES_WORKSPACE_PARTICIPATION_HEADING
    : USERS_AND_ROLES_REVIEW_PARTICIPATION_HEADING;
}

export function usersAndRolesReviewParticipationBody(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_USERS_AND_ROLES_WORKSPACE_PARTICIPATION_BODY
    : USERS_AND_ROLES_REVIEW_PARTICIPATION_BODY;
}
