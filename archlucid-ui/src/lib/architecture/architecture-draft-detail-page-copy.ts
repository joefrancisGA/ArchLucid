import { ARCHITECTURE_DRAFT_WORKSPACE_LEAD } from "@/lib/create-vs-review-intake-copy";

export const ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING = "Drafting workspace only";

export const ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER =
  "Refine this saved brief on this device before starting a review. Autosave keeps progress local to this browser until you file evidence.";

export function architectureDraftDetailPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER : ARCHITECTURE_DRAFT_WORKSPACE_LEAD;
}

export const ARCHITECTURE_DRAFT_DETAIL_LOAD_RETRY_LABEL = "Retry loading draft";

export const ARCHITECTURE_DRAFT_DETAIL_ARCHITECTURE_ID_LABEL = "Draft id";

export const ARCHITECTURE_DRAFT_DETAIL_BREADCRUMB_FALLBACK_LABEL = "Architecture draft";
