export const REVIEW_ARCHIVE_CONFIRM_TITLE = "Archive review?";

export function reviewArchiveConfirmDescription(reviewTitle: string): string {
  const trimmed = reviewTitle.trim();

  return `Archive "${trimmed}"? It will be hidden from default lists. This cannot be fully undone — audit events and any sealed evidence already recorded are not erased.`;
}

export const REVIEW_ARCHIVE_CONFIRM_ACTION_LABEL = "Archive review";

export const REVIEW_ARCHIVE_CONFIRM_CANCEL_LABEL = "Cancel";

export const REVIEW_ARCHIVE_SUCCESS_TOAST = "Review archived.";

export const REVIEW_ARCHIVE_FAILURE_MESSAGE = "Could not archive this review. Try again.";

export const REVIEW_ARCHIVE_SEALED_BLOCKED_MESSAGE =
  "Finalized reviews cannot be archived. Committed architecture packages remain until tenant offboarding.";
