import { INVITE_REVIEWER_PAGE_LEAD } from "@/lib/invite-reviewer-flow";

export const INVITE_REVIEWER_CLAIM_HEADING = "Access invitation only";

export const INVITE_REVIEWER_PAGE_SUBTITLE_BUYER =
  "Send a Reader or Auditor invitation so a colleague can view reviews, findings, and governance decisions — without approval, finalization, or evidence edits.";

export function inviteReviewerPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? INVITE_REVIEWER_PAGE_SUBTITLE_BUYER : INVITE_REVIEWER_PAGE_LEAD;
}
