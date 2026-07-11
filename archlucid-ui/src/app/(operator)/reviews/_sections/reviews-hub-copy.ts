/** `/reviews` hub — page header and section copy. */
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";

export const REVIEWS_HUB_PAGE_SUBTITLE =
  "Start, resume, and inspect evidence-backed architecture packages.";

export const REVIEWS_HUB_SUMMARY_IN_PROGRESS_LABEL = "In progress";

export const REVIEWS_HUB_SUMMARY_COMMITTED_LABEL = "Committed";

export const REVIEWS_HUB_SUMMARY_FINDINGS_LABEL = "Findings";

export const REVIEWS_HUB_SUMMARY_OPEN_RISKS_LABEL = "Open risks";

export const REVIEWS_HUB_SUMMARY_READY_FOR_GOVERNANCE_LABEL = "Ready for governance";

export const REVIEWS_HUB_SUMMARY_EMPTY_HINT =
  "Metrics populate after architecture packages are created or finalized.";

export const REVIEWS_HUB_PRIMARY_START_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const REVIEWS_HUB_CREATE_ARCHITECTURE_HELPER_PREFIX = "Need a draft architecture? Start with";

export const REVIEWS_HUB_CREATE_ARCHITECTURE_HELPER_LINK = CREATE_ARCHITECTURE_LABEL;

export const REVIEWS_HUB_EXPLORE_SAMPLES_TITLE = "Explore samples";

export const REVIEWS_HUB_PRIMARY_LOAD_SAMPLE_LABEL = "Load Sample Workspace";

export const REVIEWS_HUB_LOAD_SAMPLE_HINT = "Populate the workspace with demo data.";

export const REVIEWS_HUB_PRIMARY_VIEW_SAMPLE_LABEL = "View Sample Package";

export const REVIEWS_HUB_VIEW_SAMPLE_HINT = "Inspect a completed architecture package.";

export const REVIEWS_HUB_COMPARE_LABEL = "Compare two reviews";

export const REVIEWS_HUB_COMPARE_HINT = "Compare changes between architecture packages.";

export const REVIEWS_HUB_RECENT_SECTION_TITLE = "Recent architecture packages";

export const REVIEWS_HUB_RECENT_EMPTY_TITLE = "No architecture packages yet";

export const REVIEWS_HUB_RECENT_EMPTY_BODY =
  "Create or review an architecture, or open a sample package to explore findings, evidence, and exports.";

export const REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const REVIEWS_HUB_PACKAGE_INCLUDES_TITLE = "What a package includes";

export const REVIEWS_HUB_PACKAGE_INCLUDES_LEAD =
  "Each finalized package includes the review record, findings, evidence trail, signed decision record, governance approval, and exports.";

export const REVIEWS_HUB_PACKAGE_INCLUDES_ITEMS = [
  "Review record",
  "Findings",
  "Evidence trail",
  "Signed decision record",
  "Governance approval",
  "Exports",
] as const;

export const REVIEWS_HUB_ADVANCED_LIST_DISCLOSURE = "Search and filter all packages";
