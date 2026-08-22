export const ARCHITECTURE_DRAFT_DELETE_CONFIRM_TITLE = "Delete architecture draft?";

export function architectureDraftDeleteConfirmDescription(displayName: string): string {
  const trimmed = displayName.trim();

  return `Delete "${trimmed}" permanently? This cannot be undone. The brief and any answers you entered will be removed. This does not delete a review if one was already started.`;
}

export const ARCHITECTURE_DRAFT_DELETE_CONFIRM_ACTION_LABEL = "Delete draft";

export const ARCHITECTURE_DRAFT_DELETE_CONFIRM_CANCEL_LABEL = "Cancel";

export const ARCHITECTURE_DRAFT_DELETE_SUCCESS_TOAST = "Architecture draft deleted.";

export const ARCHITECTURE_DRAFT_DELETE_FAILURE_MESSAGE =
  "Could not delete this architecture draft. Try again.";
