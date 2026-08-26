/** `/architecture/reviews` hub — page header and section copy. */
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";

export const REVIEWS_HUB_PAGE_TITLE = "Reviews";

export const REVIEWS_HUB_PAGE_SUBTITLE =
  "Create, refine, evaluate, and approve architecture reviews.";

/**
 * Extra orientation for empty inventory — kept out of the page subtitle for density.
 * ADR 0067 — states what the review path accepts without ranking it above Create architecture.
 */
export const REVIEWS_HUB_ARCHITECTURE_INPUT_HINT =
  "Describe or import an architecture here, or start from an architecture draft you already created.";

export const REVIEWS_HUB_MORE_WAYS_TITLE = "Samples and what a review includes";

export const REVIEWS_HUB_MORE_WAYS_SUMMARY =
  "Load a sample workspace, open the showcase review, compare finalized reviews, or scan deliverables.";

export const REVIEWS_HUB_FILTER_MORE_LABEL = "More filters";

export const REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL = "Active";

export const REVIEWS_HUB_SUMMARY_COMMITTED_LABEL = "Finalized";

export const REVIEWS_HUB_SUMMARY_FINDINGS_LABEL = "Findings";

export const REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL = "Open risks";

export const REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL = "Awaiting approval";

export const REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL = "Ready for review";

export const REVIEWS_HUB_SUMMARY_EMPTY_HINT =
  "No findings or risks requiring attention.";

export const REVIEWS_HUB_SUMMARY_EMPTY_COUNTS_HINT =
  "Counts update as you start and finalize reviews. Ready for review counts architectures that can start a review.";

export const REVIEWS_HUB_PRIMARY_START_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

/** Shorter header CTA when page context makes the action obvious. */
export const REVIEWS_HUB_HEADER_START_LABEL = "Start review";

export const REVIEWS_HUB_RESUME_DRAFTS_TITLE = "Architectures ready for review";

export const REVIEWS_HUB_RESUME_DRAFTS_BODY =
  "Architecture drafts appear here as inputs — continue editing or start a review when ready.";

export const REVIEWS_HUB_RESUME_DRAFTS_VIEW_ALL_LABEL = "View all drafts";

export const REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL = "Continue editing";

export const REVIEWS_HUB_RESUME_DRAFTS_START_LABEL = "Start review";

export const REVIEWS_HUB_EXPLORE_SAMPLES_TITLE = "Explore samples";

export const REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL = "Load sample workspace";

export const REVIEWS_HUB_LOAD_SAMPLE_HINT = "Populate the workspace with demo data.";

export const REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL = "Explore the sample review";

export const REVIEWS_HUB_VIEW_SAMPLE_HINT = "Walk through a finalized review with evidence, findings, and exports.";

export const REVIEWS_HUB_COMPARE_LABEL = "Compare two reviews";

export const REVIEWS_HUB_COMPARE_HINT = "Compare changes between finalized reviews.";

export const REVIEWS_HUB_RECENT_EMPTY_TITLE = "No reviews yet";

export const REVIEWS_HUB_RECENT_EMPTY_BODY =
  `Architecture reviews are where findings, evidence, approvals, and approval decisions are recorded. ${REVIEWS_HUB_ARCHITECTURE_INPUT_HINT}`;

export const REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL = "Explore the sample review";

/** Empty inventory copy when architecture drafts exist but no review runs yet. */
export const REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE = "No reviews yet";

/** Empty inventory when exactly one draft — header Continue owns the draft chooser. */
export const REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY =
  "Architecture reviews are where findings, evidence, approvals, and approval decisions are recorded. Continue editing from the header, then start a review when ready.";

/** Empty inventory when multiple drafts — supporting strip lists architectures ready for review. */
export const REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY =
  "Architecture reviews are where findings, evidence, approvals, and approval decisions are recorded. Pick an architecture ready for review below, or start a new review.";

/** @deprecated Prefer sole/multi bodies; kept for callers that only know drafts exist. */
export const REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_BODY = REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFTS_BODY;

export const REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_PRIMARY_LABEL = "Continue editing architecture draft";

export const REVIEWS_HUB_INCLUDES_TITLE = "What each review contains";

export const REVIEWS_HUB_INCLUDES_LEAD =
  "A finalized review brings together findings, evidence, decisions, approval records, a finalized review record, and exports.";

export const REVIEWS_HUB_INCLUDES_ITEMS = [
  "Architecture description",
  "Findings",
  "Evidence graph",
  "Finalized review record",
  "Resolve outcomes",
  "Exports",
] as const;


export const REVIEWS_HUB_PINNED_REVIEWS_TITLE = "Pinned reviews";

export const REVIEWS_HUB_ALL_REVIEWS_TITLE = "Reviews";

export const REVIEWS_HUB_SHOW_ARCHIVED_REVIEWS_LABEL = "Show archived reviews";

export const REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE = "Search and filter all reviews";

export const REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER = "Search reviews…";

export const REVIEWS_HUB_FILTER_STATUS_LABEL = "Status";

export const REVIEWS_HUB_FILTER_STAGE_LABEL = "Stage";

export const REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL = "Needs attention";

export const REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL = "Updated recently";

export const REVIEWS_HUB_FILTER_FINALIZED_LABEL = "Finalized";

/** Shown when the reviews list API returns 404 / RESOURCE_NOT_FOUND (not an empty inventory). */
export const REVIEWS_HUB_LIST_NOT_FOUND_TRY_NEXT =
  "Confirm the workspace selector, then reload. If this continues, contact support with the reference id.";

export const REVIEWS_HUB_LIST_LOAD_FAILURE_TRY_NEXT =
  "The reviews list could not be loaded. Check your connection and try reloading.";

/** @deprecated Use {@link REVIEWS_HUB_INCLUDES_TITLE}. */
export const REVIEWS_HUB_PACKAGE_INCLUDES_TITLE = REVIEWS_HUB_INCLUDES_TITLE;

/** @deprecated Use {@link REVIEWS_HUB_INCLUDES_LEAD}. */
export const REVIEWS_HUB_PACKAGE_INCLUDES_LEAD = REVIEWS_HUB_INCLUDES_LEAD;

/** @deprecated Use {@link REVIEWS_HUB_INCLUDES_ITEMS}. */
export const REVIEWS_HUB_PACKAGE_INCLUDES_ITEMS = REVIEWS_HUB_INCLUDES_ITEMS;
