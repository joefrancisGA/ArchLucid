import { INVITE_REVIEWER_PAGE_LEAD } from "@/lib/invite-reviewer-flow";

export const INVITE_REVIEWER_PRIMARY_CONTENT_ID = "invite-reviewer-primary-content" as const;

export const INVITE_REVIEWER_FIRST_VIEWPORT_ID = "invite-reviewer-first-viewport" as const;

export const INVITE_REVIEWER_FIRST_VIEWPORT_TEST_ID = INVITE_REVIEWER_FIRST_VIEWPORT_ID;

export const INVITE_REVIEWER_SKIP_TARGET_ID = INVITE_REVIEWER_FIRST_VIEWPORT_ID;

export const INVITE_REVIEWER_SKIP_LINK_LABEL = "Skip to invite reviewer workspace" as const;

export const INVITE_REVIEWER_CLAIM_HEADING = "Access invitation only";

export const INVITE_REVIEWER_PAGE_SUBTITLE_BUYER =
  "Send a Reader or Auditor invitation so a colleague can view reviews, findings, and approval decisions — without approval, finalization, or evidence edits.";

export function inviteReviewerPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? INVITE_REVIEWER_PAGE_SUBTITLE_BUYER : INVITE_REVIEWER_PAGE_LEAD;
}
