/** Create-bootstrap page subtitle lead — drafting scope + draft≠review boundary (TB-1454). */
export const ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE =
  "Drafting workspace — creating or saving does not start a review.";

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER =
  `${ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE} Describe the system, outcome, and scope below. Your first save creates a draft on this device; nothing syncs across browsers until you file evidence for a review.`;

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS =
  `${ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE} Continue a saved draft above or describe a new system below. Autosave keeps each draft on this browser only.`;

/** Operator `/architectures/new` subtitles — not shared with other create-path surfaces. */
export const ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR =
  `${ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE} Describe the system, the outcome it must deliver, and the people and systems it touches. Start a new draft below — autosave keeps drafts on this device.`;

export const ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR_WITH_DRAFTS =
  `${ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE} Continue a saved draft below, or describe a new system — outcome, people, and systems it touches. Autosave applies on this device only.`;

export function architecturesNewPageSubtitle(buyerPolishedShell: boolean, hasLocalDrafts: boolean): string {
  if (!buyerPolishedShell) {
    return hasLocalDrafts
      ? ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR_WITH_DRAFTS
      : ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR;
  }

  return hasLocalDrafts
    ? ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS
    : ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER;
}
