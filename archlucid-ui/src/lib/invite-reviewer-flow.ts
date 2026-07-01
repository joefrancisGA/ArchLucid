import type { ArchLucidAppRole } from "@/lib/current-principal";

/** Canonical invite-reviewer route from operator home optional-setup and admin deep links. */
export const INVITE_REVIEWER_PATH = "/settings/roles/invite-reviewer";

/** Users tab on roles admin — hosts the invite form on the combined roles page. */
export const SETTINGS_ROLES_USERS_TAB_PATH = "/settings/roles?tab=users";

export const INVITE_REVIEWER_PAGE_TITLE = "Invite reviewer";

export const INVITE_REVIEWER_PAGE_LEAD =
  "Invite a colleague to participate in architecture reviews for this workspace. Reviewers are assigned the Reader role: they can view review packages, findings, and governance decisions, but cannot approve, finalize, or modify evidence.";

export const INVITE_REVIEWER_DEFAULT_ROLE: ArchLucidAppRole = "Reader";

/** Return path after cancel or back from the invite flow (operator overview). */
export const INVITE_REVIEWER_BACK_TO_REVIEW_HREF = "/";

/** Label for the back navigation — matches the destination (Overview), not "a review." */
export const INVITE_REVIEWER_BACK_LABEL = "Back to overview";

export const INVITE_REVIEWER_FORBIDDEN_DESCRIPTION =
  "Inviting reviewers requires workspace administrator access. Ask a workspace admin to send the invitation, or sign in with an admin-ranked account.";

export const INVITE_REVIEWER_FOOTER_LEAD = "Need to manage users or permissions?";

export type InviteReviewerReaderCapability = {
  allowed: boolean;
  label: string;
};

/** Compact can/cannot list below invite page lead (TB-511). */
export const INVITE_REVIEWER_READER_CAPABILITIES_HEADING = "Reader role capabilities:";

export const INVITE_REVIEWER_READER_CAPABILITIES: readonly InviteReviewerReaderCapability[] = [
  { allowed: true, label: "View review packages, findings, and governance decisions" },
  { allowed: true, label: "Export signed review records and audit CSVs" },
  { allowed: false, label: "Cannot approve governance requests" },
  { allowed: false, label: "Cannot finalize review packages" },
  { allowed: false, label: "Cannot modify evidence or review settings" },
];
