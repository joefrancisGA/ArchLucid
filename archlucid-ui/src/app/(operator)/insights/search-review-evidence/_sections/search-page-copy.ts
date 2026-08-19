import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";

/** Search page H1 when no review filter is set (TB-2196). */
export const SEARCH_PAGE_TITLE = EVIDENCE_TRAIL_SEARCH.title;

/** Search page subtitle — tenant-scoped retrieval over sealed review records and the evidence trail. */
export const SEARCH_PAGE_SUBTITLE = EVIDENCE_TRAIL_SEARCH.pageSubtitle;

/** Buyer-polished lead — shorter, sponsor-safe retrieval framing (SXX). */
export const SEARCH_PAGE_SUBTITLE_BUYER =
  "Find findings, decisions, and sealed review records across your workspace evidence index.";

export function searchReviewEvidencePageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? SEARCH_PAGE_SUBTITLE_BUYER : SEARCH_PAGE_SUBTITLE;
}

export const SEARCH_PAGE_LOADING_STATUS = "Loading search review evidence…";

export const SEARCH_LOAD_RETRY_LABEL = "Retry search";

export const SEARCH_QUERY_PLACEHOLDER = EVIDENCE_TRAIL_SEARCH.queryPlaceholder;

/** Visible label above the evidence query field (TB-2196). */
export const SEARCH_QUERY_FIELD_LABEL = EVIDENCE_TRAIL_SEARCH.queryFieldLabel;

export const SEARCH_REVIEW_FILTER_LABEL = "Limit to review (optional)";

export const SEARCH_REVIEW_FILTER_PLACEHOLDER = "All reviews";

export const SEARCH_EXAMPLE_QUERIES = [
  "PHI boundary",
  "SSO risk",
  "data residency",
  "approval conditions",
  "audit export",
] as const;

export const SEARCH_EXAMPLE_QUERIES_LINE = `Try: ${SEARCH_EXAMPLE_QUERIES.map((q) => `"${q}"`).join(", ")}`;