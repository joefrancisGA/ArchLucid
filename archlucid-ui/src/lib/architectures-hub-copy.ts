import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture-workflow-labels";

/** Page chrome for `/architectures` — object-oriented architecture draft inventory. */
export const ARCHITECTURES_HUB_PAGE_TITLE = ARCHITECTURE_DRAFTS_LIST_LABEL;

export const ARCHITECTURES_HUB_PAGE_SUBTITLE =
  "Saved architecture drafts in this workspace. Not an architecture package or review inventory — start a review when you are ready." as const;

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
  "Capture your system design as a long-lived draft. Create an architecture, refine it over multiple sessions, then start a governance review when you are ready." as const;

export const ARCHITECTURES_HUB_EMPTY_FILTER_TITLE = "No drafts match your filters" as const;

export const ARCHITECTURES_HUB_EMPTY_FILTER_BODY =
  "Try clearing search or choosing a different filter." as const;
