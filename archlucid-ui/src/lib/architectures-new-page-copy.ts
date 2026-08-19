import {
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
  ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD,
  ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
} from "@/lib/create-vs-review-intake-copy";

export const ARCHITECTURES_NEW_CLAIM_HEADING = "Create-bootstrap only";

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER =
  "Start a new architecture draft on this device. Nothing is shared across browsers until you save and file evidence for a review.";

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS =
  "Continue a saved draft below or start a fresh architecture brief when you are ready.";

export function architecturesNewPageSubtitle(buyerPolishedShell: boolean, hasLocalDrafts: boolean): string {
  if (!buyerPolishedShell) {
    return hasLocalDrafts ? ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS : ARCHITECTURE_CREATION_PAGE_SUBTITLE;
  }

  return hasLocalDrafts
    ? ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS
    : ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER;
}

export const ARCHITECTURES_NEW_WORKSPACE_LEAD_BUYER =
  "Describe the system, the outcome it must deliver, and the people and systems it touches. Your first save creates the draft on this device.";

export const ARCHITECTURES_NEW_WORKSPACE_LEAD_BUYER_WITH_DRAFTS =
  "Pick up a saved draft above or describe a new system below. Autosave keeps each draft on this browser only.";

export function architecturesNewWorkspaceLead(
  buyerPolishedShell: boolean,
  hasLocalDraftsOnCreatePath: boolean,
): string {
  if (!buyerPolishedShell) {
    return hasLocalDraftsOnCreatePath
      ? ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD
      : ARCHITECTURE_DRAFT_WORKSPACE_LEAD;
  }

  return hasLocalDraftsOnCreatePath
    ? ARCHITECTURES_NEW_WORKSPACE_LEAD_BUYER_WITH_DRAFTS
    : ARCHITECTURES_NEW_WORKSPACE_LEAD_BUYER;
}
