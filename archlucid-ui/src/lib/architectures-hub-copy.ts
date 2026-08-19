import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OPERATOR_NAV_GROUP_LABELS } from "@/lib/i18n";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

/** Page chrome for `/architectures` — object-oriented architecture draft inventory. */
export const ARCHITECTURES_HUB_PAGE_TITLE = ARCHITECTURE_DRAFTS_LIST_LABEL;

export const ARCHITECTURES_HUB_PAGE_SUBTITLE =
  "This draft list stays on this device after you close the browser — not a shared tenant-wide inventory." as const;

export const ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER =
  "Saved architecture drafts in this browser — start a review when a draft is ready for evidence intake." as const;

export function architecturesHubPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER : ARCHITECTURES_HUB_PAGE_SUBTITLE;
}

export const ARCHITECTURES_HUB_BREADCRUMB_PARENT_LABEL = OPERATOR_NAV_GROUP_LABELS.reviewWork;

export const ARCHITECTURES_HUB_BREADCRUMB_PARENT_HREF = REVIEWS_LIST_PATH;

export const ARCHITECTURES_HUB_CLAIM_HEADING = "Draft inventory only";

export const ARCHITECTURES_HUB_LIST_SKELETON_STATUS = "Loading architecture drafts…";

export const ARCHITECTURES_HUB_FILTER_SEARCH_PLACEHOLDER = "Search drafts" as const;

export const ARCHITECTURES_HUB_FILTER_ALL_LABEL = "All" as const;

export const ARCHITECTURES_HUB_FILTER_DRAFT_LABEL = "Draft" as const;

export const ARCHITECTURES_HUB_FILTER_READY_LABEL = "Ready for review" as const;

export const ARCHITECTURES_HUB_FILTER_ARCHIVED_LABEL = "Archived" as const;

export const ARCHITECTURES_HUB_FILTER_NO_REVIEW_LABEL = "No review yet" as const;

export const ARCHITECTURES_HUB_SORT_UPDATED_DESC_LABEL = "Updated (newest)" as const;

export const ARCHITECTURES_HUB_SORT_UPDATED_ASC_LABEL = "Updated (oldest)" as const;

export const ARCHITECTURES_HUB_SORT_NAME_ASC_LABEL = "Name (A–Z)" as const;

export const ARCHITECTURES_HUB_SORT_NAME_DESC_LABEL = "Name (Z–A)" as const;

export const ARCHITECTURES_HUB_EMPTY_TITLE = "No architecture drafts yet" as const;

export const ARCHITECTURES_HUB_EMPTY_BODY =
  "Create a draft here, then start an architecture review when it is ready." as const;

export const ARCHITECTURES_HUB_EMPTY_FILTER_TITLE = "No drafts match your filters" as const;

export const ARCHITECTURES_HUB_EMPTY_FILTER_BODY =
  "Try clearing search or choosing a different filter." as const;

export const ARCHITECTURES_HUB_LIST_LOADING_LABEL = "Loading drafts…" as const;

export const ARCHITECTURES_HUB_TABLE_ACTIONS_COLUMN = "Actions" as const;

export const ARCHITECTURES_HUB_TABLE_DRAFT_COLUMN = "Draft" as const;

export const ARCHITECTURES_HUB_TABLE_OWNER_COLUMN = "Owner" as const;

export const ARCHITECTURES_HUB_TABLE_REVIEW_COLUMN = "Review" as const;

export const ARCHITECTURES_HUB_TABLE_STATUS_COLUMN = "Status" as const;

export const ARCHITECTURES_HUB_TABLE_UPDATED_COLUMN = "Updated" as const;
