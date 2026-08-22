/**
 * Reviews list and dashboard copy — filters, tabs, empty states, and origin badges.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

export const BUYER_RUNS_DASHBOARD_RECENT_LABEL = "Featured finalized review";

export const BUYER_RUNS_DASHBOARD_RECENT_LABEL_EMPTY = "Architecture reviews";

export const BUYER_RUNS_DASHBOARD_RECENT_SUMMARY =
  "Track findings, evidence, decisions, and finalized outputs from your architecture reviews.";

export const BUYER_RUN_INSPECTOR_FINALIZED_LABEL = "Sample · finalized";

export const BUYER_RUNS_GETTING_STARTED_GUIDE = "getting-started guide";

export const BUYER_RUNS_LIST_GLOSSARY_LEAD =
  "Open a review for the finalized review record, evidence, findings, and deliverables.";

export const BUYER_RUNS_LIST_MALFORMED_HEADING = "Reviews could not be displayed.";

export const BUYER_RUNS_LIST_MALFORMED_BODY =
  "Try reloading the page. If this continues, contact support.";

export const RUNS_LIST_EMPTY_PRIMARY_PATH_TITLE = "Start a review";

export const RUNS_LIST_EMPTY_PRIMARY_PATH_DESCRIPTION =
  "Create a review from your own architecture brief, diagram, IaC, or evidence.";

export const RUNS_LIST_EMPTY_SAMPLE_PATH_TITLE = "Explore a sample";

export const RUNS_LIST_EMPTY_SAMPLE_PATH_DESCRIPTION =
  "Open a completed sample review or run a demo review to see findings, evidence traceability, and exports.";

export const RUNS_LIST_VIEW_SAMPLE_PACKAGE_CTA = "View sample review";

export const BUYER_PIPELINE_IN_PROGRESS_LABEL = "In progress";

export const BUYER_RUNS_DASHBOARD_SECTION_HEADING = "Reviews";

export const BUYER_RUNS_DASHBOARD_TAB_APPROVED = "Approved";

export const BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING = "Approved with monitoring";

export const BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION = "Action needed";

export const BUYER_RUNS_DASHBOARD_FILTER_ALL = "All";

/** TB-740: compact origin badge on workspace/architecture/reviews list rows (buyer-polished shell only). */
export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_CREATED_BADGE = "Created";

export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_BADGE = "Reviewed";

/**
 * Axis label used when package origin renders as a metadata line instead of a pill.
 * Origin is provenance (who authored the architecture), not a governance verdict — surfaces that
 * show both must label it, or `Reviewed` reads as a second, conflicting outcome next to the status tag.
 */
export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_METADATA_LABEL = "Package origin";

export const BUYER_ARCHITECTURE_PACKAGE_ORIGIN_REVIEWED_DISCLOSURE =
  "Reviewed means the architecture package was assessed in a completed review — not that resolve outcomes are complete.";

/** Footer navigation on home reviews card — distinct from the All status filter pill. */
export const BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA = "Open all reviews";

/** @deprecated Use {@link BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA}. */
export const BUYER_RUNS_DASHBOARD_VIEW_ALL_REVIEW_PACKAGES_CTA = BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA;

export const BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES =
  "No finalized reviews match this filter yet.";

export const BUYER_RUNS_DASHBOARD_OPEN_ALL_REVIEWS_CTA = "Open all reviews";
