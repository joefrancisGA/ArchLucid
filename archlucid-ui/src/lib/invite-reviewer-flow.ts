import type { ArchLucidAppRole } from "@/lib/current-principal";
import { SETTINGS_USERS_USERS_TAB_PATH } from "@/lib/settings-admin-route-paths";

/** Canonical invite-reviewer route from operator home optional-setup and admin deep links. */
export const INVITE_REVIEWER_PATH = "/administration/users/invite-reviewer";

/** Query param prefilling invite context from a finalized review package handoff. */
export const INVITE_REVIEWER_REVIEW_ID_QUERY_PARAM = "reviewId";

export function buildInviteReviewerHref(reviewId?: string | null): string {
  const trimmed = reviewId?.trim() ?? "";

  if (trimmed.length === 0) {
    return INVITE_REVIEWER_PATH;
  }

  const params = new URLSearchParams({ [INVITE_REVIEWER_REVIEW_ID_QUERY_PARAM]: trimmed });

  return `${INVITE_REVIEWER_PATH}?${params.toString()}`;
}

export function buildInviteReviewerPrefillMessage(reviewId: string): string {
  const trimmed = reviewId.trim();

  return `Please review the finalized architecture review package for review ${trimmed}.`;
}

/** Users tab on the combined users-and-roles admin page. */
export const SETTINGS_ROLES_USERS_TAB_PATH = SETTINGS_USERS_USERS_TAB_PATH;

export const INVITE_REVIEWER_PAGE_TITLE = "Invite reviewer";

export const INVITE_REVIEWER_PAGE_LEAD =
  "Invite a colleague to participate in architecture reviews for this workspace. Reviewers are assigned the Reader role: they can view reviews, findings, and approval decisions, but cannot approve, finalize, or modify evidence.";

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
  { allowed: true, label: "View reviews, findings, and approval decisions" },
  { allowed: true, label: "Export finalized review records and audit CSVs" },
  { allowed: false, label: "Cannot approve pending requests" },
  { allowed: false, label: "Cannot finalize reviews" },
  { allowed: false, label: "Cannot modify evidence or review settings" },
];
