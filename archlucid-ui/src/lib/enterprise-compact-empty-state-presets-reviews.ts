import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/empty-state-presets";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_FINDINGS_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";
import {
  ALERT_RULES_LIST_EMPTY_BODY,
} from "@/lib/alert-rule-conditions-copy";
import {
  COMPOSITE_RULES_LIST_EMPTY_BODY,
  COMPOSITE_RULES_NOUN,
} from "@/lib/enterprise-controls-context-copy";
import {
  ADVISORY_SCANS_SCHEDULES_EMPTY_BODY,
  ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY,
  ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_TITLE,
} from "@/lib/advisory-copy";
import {
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
  ALERTS_EMPTY_FILTERED_BODY,
  ALERTS_EMPTY_FILTERED_TITLE,
  ALERTS_EMPTY_HEALTHY_BODY,
  ALERTS_EMPTY_HEALTHY_TITLE,
  ALERTS_EMPTY_NO_REVIEWS_BODY,
  ALERTS_EMPTY_NO_REVIEWS_TITLE,
  ALERTS_EMPTY_NO_RULES_BODY,
  ALERTS_EMPTY_NO_RULES_TITLE,
} from "@/lib/alerts-page-copy";
import {
  STANDARDS_RULES_EMPTY_BODY,
  STANDARDS_RULES_EMPTY_HEADING,
} from "@/lib/standards-rules-page";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { buildInsightsFinalizedReviewPrerequisiteEmpty } from "@/lib/insights-finalized-review-prerequisite-empty";
import {
  buildOperatorFilteredEmptyCompact,
  buildOperatorHubZoneEmptyCompact,
  buildOperatorPermissionEmptyCompact,
  buildOperatorPrerequisiteEmptyCompact,
} from "@/lib/operator/operator-empty-state-kind-presets";
import {
  ACCOUNT_SECURITY_AUTH_GATE_MESSAGE,
  ACCOUNT_SECURITY_DEMO_GATE_MESSAGE,
} from "@/lib/account-security-page-copy";
import { buildAuthSignInHref } from "@/lib/navigation/auth-sign-in-href";
import {
  API_KEYS_FORBIDDEN_EMPTY_BODY,
  API_KEYS_SURFACE_DISABLED_DESCRIPTION,
} from "@/lib/api-keys-settings-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  REVIEW_SCORECARD_EMPTY_DESCRIPTION,
  REVIEW_SCORECARD_EMPTY_HEADING,
  REVIEW_SCORECARD_EMPTY_PRIMARY_CTA,
  REVIEW_SCORECARD_EMPTY_PRIMARY_HREF,
  REVIEW_SCORECARD_EMPTY_SECONDARY_CTA,
  REVIEW_SCORECARD_EMPTY_SECONDARY_HREF,
  REVIEW_SCORECARD_EMPTY_TERTIARY_CTA,
  buildReviewScorecardSampleHref,
} from "@/lib/review-scorecard-empty-state";
import { PILOT_FEEDBACK_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import {
  INTEGRATION_EVENTS_DLQ_EMPTY_DESCRIPTION,
  INTEGRATION_EVENTS_DLQ_EMPTY_TITLE,
} from "@/lib/integration-events-dlq-page-copy";
import { WEBHOOKS_EMPTY_BODY, WEBHOOKS_EMPTY_TITLE } from "@/lib/webhooks-page-copy";
import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { API_KEYS_USERS_USERS_LINK } from "@/lib/vocabulary/api-keys-users-vocabulary";

/** Reviews list when the project has zero reviews. */
export const RUNS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "runs-list-empty-state",
  title: "No reviews yet",
  description:
    "Start an architecture review to gather evidence, evaluate findings, and record decisions. Or explore the sample review.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "primary" },
    { label: AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL, href: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`, variant: "outline" },
  ],
};

/** Operator home reviews zone — copy only; primary next step lives on the hero Do-this-next card (TB-1038). */
export const OPERATOR_HOME_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "operator-home-workspace-empty-state",
  title: OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
  description: OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
};

/** Workspace Activity archived filter — no archived reviews in scope. */
export const OPERATOR_HOME_ARCHIVED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "operator-home-workspace-archived-empty-state",
  title: OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  description: OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
};

/** Semantic search returned no hits. */
export const SEARCH_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "search-empty-state",
  title: "No matches for that query",
  description:
    "Try different wording, clear the review filter, or ensure your workspace has finalized review evidence indexed for search.",
  actions: [
    { label: "Open Ask", href: "/insights/ask-review-questions", variant: "outline" },
    { label: "Evidence graph", href: "/insights/evidence-graph", variant: "outline" },
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
  ],
};

/** Planning themes/plans empty for current scope. */
export const PLANNING_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "planning-empty-state",
  title: "No improvement plans yet",
  description:
    "Capture review feedback or run pilot feedback analysis to generate themes and prioritized plans.",
  actions: [
    { label: "Capture review feedback", href: "/internal/product-learning", variant: "primary" },
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
  ],
};

/** Compare page before both reviews are selected. */
export const COMPARE_WAITING_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
  ],
};

/** Compare finding correlation panel when export metadata is absent. */
export const COMPARE_FINDING_CORRELATION_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-finding-correlation-empty-state",
  title: "No correlation metadata",
  description:
    "No finding correlation metadata on this comparison (API may predate correlation export metadata).",
};

/** Compare page when zero finalized reviews exist. */
export const COMPARE_ZERO_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps =
  buildInsightsFinalizedReviewPrerequisiteEmpty({ jobId: "compare", finalizedCount: 0 });

/** Architecture scorecard when no finalized reviews exist yet. */
export const REVIEW_SCORECARD_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps =
  buildInsightsFinalizedReviewPrerequisiteEmpty({
    jobId: "scorecard",
    finalizedCount: 0,
    includeSampleAction: true,
  });

/** Pilot feedback dashboard when no signals exist in the selected scope. */
export const PRODUCT_LEARNING_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "product-learning-empty-state",
  title: PILOT_FEEDBACK_VOCABULARY.emptyStateTitle,
  description: PILOT_FEEDBACK_VOCABULARY.emptyStateDescription,
  actions: [
    { label: PILOT_FEEDBACK_VOCABULARY.emptyStatePrimaryAction, href: "/architecture/reviews", variant: "primary" },
    {
      label: PILOT_FEEDBACK_VOCABULARY.emptyStateSecondaryAction,
      href: "/architecture/reviews/new",
      variant: "outline",
    },
  ],
};

/** Compare page when fewer than two finalized reviews exist. */
export const COMPARE_INSUFFICIENT_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-insufficient-finalized-empty-state",
  title: "One finalized review available",
  description: "Finalize one more review to compare changes over time.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "outline" },
  ],
};

/** Sponsor reviews index when no finalized packages exist. */
export const SPONSOR_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "sponsor-reviews-empty-state",
  title: "No finalized reviews yet",
  description:
    "Finalized reviews appear here after you finalize the review and lock the architecture review.",
  actions: [
    { label: "See a completed sample review", href: "/see-it", variant: "primary" },
    { label: "Start a review", href: "/architecture/reviews/new", variant: "outline" },
  ],
};

/** Run detail overview when the review pipeline has not produced assessable outcomes yet. */
export const RUN_DETAIL_INCOMPLETE_OVERVIEW_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorPrerequisiteEmptyCompact("a completed review assessment", {
    testId: "run-detail-incomplete-overview-empty-state",
    description:
      "Findings, evidence coverage, and sponsor-ready summaries appear after the assessment completes. Follow Do this next above to recover or re-run the review.",
    actions: [],
  });

/** Run detail deliverables panel before the review is finalized. */
export const RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "run-deliverables-pending-finalize-empty-state",
  title: "No deliverables yet",
  description:
    "Signed deliverables appear here after you finalize the review on review detail. Until then, findings and evidence remain on the review.",
  actions: [],
};

/** Run detail deliverables when a negative feasibility decision is the complete deliverable. */
export const RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "run-detail-decision-receipt-empty-state",
  title: "Decision delivered — design not feasible",
  description:
    'A defensible "no" is a complete deliverable. Export the decision receipt for audit, sponsor handoff, or portfolio records.',
};

/** Signed-record manifest when the artifact descriptor list is empty (operator chrome). */
export const MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "manifest-deliverables-empty-state",
  title: "No artifacts listed for this review",
  description:
    "The summary loaded, but the artifact descriptor list is empty. Bundle download may be available when there is a bundle.",
};

/** Buyer-polished compare idle state. */
export const COMPARE_WAITING_BUYER_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
  ],
};
