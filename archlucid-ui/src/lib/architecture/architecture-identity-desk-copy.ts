import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const ARCHITECTURE_IDENTITY_DESK_PAGE_TITLE = "Architecture" as const;

export const ARCHITECTURE_IDENTITY_DESK_UPDATED_LABEL = "Last updated" as const;

export const ARCHITECTURE_IDENTITY_DESK_CURRENT_DRAFT_LABEL = "Current draft" as const;

export const ARCHITECTURE_IDENTITY_DESK_NO_OPEN_DRAFT = "No open draft" as const;

export const ARCHITECTURE_IDENTITY_DESK_NEW_VERSION_LABEL = "New draft version" as const;

export const ARCHITECTURE_IDENTITY_DESK_REVIEWS_SECTION_TITLE = "Reviews" as const;

export const ARCHITECTURE_IDENTITY_DESK_LATEST_SEAL_LABEL = "Latest sealed record" as const;

export const ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL = "Compare reviews" as const;

export const ARCHITECTURE_IDENTITY_DESK_RENAME_LABEL = "Architecture name" as const;

export const ARCHITECTURE_IDENTITY_DESK_RENAME_SAVE_LABEL = "Save name" as const;

export const ARCHITECTURE_IDENTITY_DESK_RENAME_EMPTY_ERROR = "Enter a name for this architecture." as const;

export const ARCHITECTURE_IDENTITY_DESK_RENAME_HELPER =
  "Renames the durable architecture identity. Draft document titles stay unchanged." as const;

export const ARCHITECTURE_IDENTITY_DESK_LEGACY_DRAFT_HONESTY =
  "This URL opens an architecture draft, not the durable architecture identity. Save or link the draft to reopen it from your architecture portfolio." as const;

export const ARCHITECTURE_IDENTITY_LIST_PAGE_TITLE = "Architectures" as const;

export const ARCHITECTURE_IDENTITY_LIST_PAGE_SUBTITLE =
  "Durable architecture identities in this workspace — each groups drafts and sealed review records." as const;

export const ARCHITECTURE_IDENTITY_LIST_CLAIM_DISCIPLINE =
  "Each row is a durable architecture identity — not a draft or a sealed review record. Open one to see its drafts and reviews." as const;

export const ARCHITECTURE_IDENTITY_DESK_HONESTY_LINE =
  "This is the durable architecture identity for your system — not a sealed review record." as const;

export const ARCHITECTURE_IDENTITY_DESK_REVIEWS_EMPTY = "No reviews yet" as const;

export const ARCHITECTURE_IDENTITY_DESK_START_REVIEW_LABEL = "Start review" as const;

export const ARCHITECTURE_IDENTITY_DESK_IN_FLIGHT_HEADING = "Review in progress" as const;

export const ARCHITECTURE_IDENTITY_DESK_VERSIONS_SECTION_TITLE = "Architecture versions" as const;

export const ARCHITECTURE_IDENTITY_DESK_VERSIONS_HONESTY =
  "Version pins are read-only history — not a draft merge or edit surface." as const;

export const ARCHITECTURE_IDENTITY_DESK_VERSIONS_EMPTY =
  "No architecture version pins yet for this identity." as const;

export const ARCHITECTURE_IDENTITY_LIST_EMPTY_TITLE = "No architectures yet" as const;

export const ARCHITECTURE_IDENTITY_LIST_EMPTY_BODY =
  "Create an architecture draft and save it to establish an identity you can reopen all week." as const;

export const ARCHITECTURE_IDENTITY_LIST_EMPTY_PRIMARY_LABEL = "New architecture" as const;

export const ARCHITECTURE_IDENTITY_LIST_LOADING_LABEL = "Loading architectures…" as const;

export const ARCHITECTURE_IDENTITY_TABLE_NAME_COLUMN = "Architecture" as const;

export const ARCHITECTURE_IDENTITY_TABLE_UPDATED_COLUMN = "Updated" as const;

export const ARCHITECTURE_IDENTITY_TABLE_REVIEWS_COLUMN = "Reviews" as const;

export const ARCHITECTURE_IDENTITY_TABLE_DRAFTS_COLUMN = "Drafts" as const;

export const ARCHITECTURE_IDENTITY_LIST_SHOW_ARCHIVED_LABEL = "Show archived" as const;

export const ARCHITECTURE_IDENTITY_ARCHIVE_ACTION_LABEL = "Archive architecture" as const;

export const ARCHITECTURE_IDENTITY_RESTORE_ACTION_LABEL = "Restore architecture" as const;

export const ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_TITLE = "Archive this architecture?" as const;

export const ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_ACTION_LABEL = "Archive" as const;

export const ARCHITECTURE_IDENTITY_RESTORE_CONFIRM_TITLE = "Restore this architecture?" as const;

export const ARCHITECTURE_IDENTITY_RESTORE_CONFIRM_ACTION_LABEL = "Restore" as const;

export const ARCHITECTURE_IDENTITY_ARCHIVE_CONFIRM_CANCEL_LABEL = "Cancel" as const;

export const ARCHITECTURE_IDENTITY_ARCHIVE_SUCCESS_TOAST = "Architecture archived." as const;

export const ARCHITECTURE_IDENTITY_RESTORE_SUCCESS_TOAST = "Architecture restored." as const;

export const ARCHITECTURE_IDENTITY_ARCHIVE_FAILURE_MESSAGE = "Could not update archive state." as const;

export const architectureIdentityArchiveConfirmDescription = (displayName: string): string =>
  `${displayName.trim().length > 0 ? displayName.trim() : "This architecture"} will leave your default portfolio. Drafts and sealed review records stay attached — open them from this desk or turn on Show archived on the hub.`;

export const architectureIdentityRestoreConfirmDescription = (displayName: string): string =>
  `${displayName.trim().length > 0 ? displayName.trim() : "This architecture"} will reappear in your default Working portfolio.`;

export const architectureIdentityDeskPageTitle = (displayName: string): string =>
  displayName.trim().length > 0 ? displayName.trim() : ARCHITECTURE_IDENTITY_DESK_PAGE_TITLE;

export const architectureIdentityDeskHeadingClass = OPERATOR_TYPOGRAPHY.pageTitle;
