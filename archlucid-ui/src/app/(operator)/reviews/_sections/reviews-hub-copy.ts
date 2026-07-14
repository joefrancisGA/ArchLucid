/** `/reviews` hub — page header and section copy. */
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";

export const REVIEWS_HUB_PAGE_TITLE = "Reviews";

export const REVIEWS_HUB_PAGE_SUBTITLE =
  "Create, refine, evaluate, and approve architecture reviews.";

export const REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL = "Active";

export const REVIEWS_HUB_SUMMARY_COMMITTED_LABEL = "Finalized";

export const REVIEWS_HUB_SUMMARY_FINDINGS_LABEL = "Findings";

export const REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL = "Open risks";

export const REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL = "Awaiting approval";

export const REVIEWS_HUB_SUMMARY_EMPTY_HINT =
  "Metrics populate after you start or finalize architecture reviews.";

export const REVIEWS_HUB_PRIMARY_START_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const REVIEWS_HUB_RESUME_DRAFTS_TITLE = "Resume a draft";

export const REVIEWS_HUB_RESUME_DRAFTS_BODY =
  "Saved architecture drafts stay editable until you start a review from them.";

export const REVIEWS_HUB_RESUME_DRAFTS_VIEW_ALL_LABEL = "View all drafts";

export const REVIEWS_HUB_RESUME_DRAFTS_CONTINUE_LABEL = "Continue editing";

export const REVIEWS_HUB_EXPLORE_SAMPLES_TITLE = "Explore samples";

export const REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL = "Load sample workspace";

export const REVIEWS_HUB_LOAD_SAMPLE_HINT = "Populate the workspace with demo data.";

export const REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL = "Explore the sample review";

export const REVIEWS_HUB_VIEW_SAMPLE_HINT = "Walk through a finalized review with evidence, findings, and exports.";

export const REVIEWS_HUB_COMPARE_LABEL = "Compare two reviews";

export const REVIEWS_HUB_COMPARE_HINT = "Compare changes between finalized reviews.";

export const REVIEWS_HUB_RECENT_SECTION_TITLE = "Your reviews";

export const REVIEWS_HUB_RECENT_EMPTY_TITLE = "Start your first architecture review";

export const REVIEWS_HUB_RECENT_EMPTY_BODY =
  "Describe or import an architecture, gather evidence, evaluate it against your policies, and record decisions in one review.";

export const REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const REVIEWS_HUB_RECENT_EMPTY_SECONDARY_LABEL = "Explore the sample review";

export const REVIEWS_HUB_INCLUDES_TITLE = "What each review contains";

export const REVIEWS_HUB_INCLUDES_LEAD =
  "A finalized review brings together findings, evidence, decisions, governance records, a signed review record, and exports.";

export const REVIEWS_HUB_INCLUDES_ITEMS = [
  "Review record",
  "Findings",
  "Evidence trail",
  "Signed review record",
  "Governance approval",
  "Exports",
] as const;

export const REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE = "Search and filter all reviews";

export const REVIEWS_HUB_FILTER_SEARCH_PLACEHOLDER = "Search reviews, systems, owners, or references";

export const REVIEWS_HUB_FILTER_STATUS_LABEL = "Status";

export const REVIEWS_HUB_FILTER_STAGE_LABEL = "Stage";

export const REVIEWS_HUB_FILTER_NEEDS_ATTENTION_LABEL = "Needs attention";

export const REVIEWS_HUB_FILTER_UPDATED_RECENTLY_LABEL = "Updated recently";

export const REVIEWS_HUB_FILTER_FINALIZED_LABEL = "Finalized";

/** @deprecated Use {@link REVIEWS_HUB_INCLUDES_TITLE}. */
export const REVIEWS_HUB_PACKAGE_INCLUDES_TITLE = REVIEWS_HUB_INCLUDES_TITLE;

/** @deprecated Use {@link REVIEWS_HUB_INCLUDES_LEAD}. */
export const REVIEWS_HUB_PACKAGE_INCLUDES_LEAD = REVIEWS_HUB_INCLUDES_LEAD;

/** @deprecated Use {@link REVIEWS_HUB_INCLUDES_ITEMS}. */
export const REVIEWS_HUB_PACKAGE_INCLUDES_ITEMS = REVIEWS_HUB_INCLUDES_ITEMS;
