import {
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
} from "@/lib/create-vs-review-intake-copy";

export const ARCHITECTURES_NEW_CLAIM_HEADING = "Drafting workspace only";

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER =
  "Describe the system, outcome, and scope below. Your first save creates a draft on this device; nothing syncs across browsers until you file evidence for a review.";

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS =
  "Continue a saved draft above or describe a new system below. Autosave keeps each draft on this browser only.";

export function architecturesNewPageSubtitle(buyerPolishedShell: boolean, hasLocalDrafts: boolean): string {
  if (!buyerPolishedShell) {
    return hasLocalDrafts ? ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS : ARCHITECTURE_CREATION_PAGE_SUBTITLE;
  }

  return hasLocalDrafts
    ? ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS
    : ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER;
}
