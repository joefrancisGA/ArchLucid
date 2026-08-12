import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import {
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/empty-state-presets";
import { GOVERNANCE_APPROVAL_QUEUE_PATH, governanceAlertRulesTabHref } from "@/lib/governance-route-paths";
import {
  ALERT_RULES_LIST_EMPTY_BODY,
} from "@/lib/alert-rule-conditions-copy";
import {
  ADVISORY_SCANS_SCHEDULES_EMPTY_BODY,
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
import {
  buildOperatorFilteredEmptyCompact,
  buildOperatorHubZoneEmptyCompact,
} from "@/lib/operator-empty-state-kind-presets";

/** Reviews list when the project has zero reviews. */
export const RUNS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "runs-list-empty-state",
  title: "No reviews yet",
  description:
    "Start an architecture review to gather evidence, evaluate findings, and record decisions. Or explore the sample review.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "primary" },
    { label: AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL, href: "/architecture/reviews/claims-intake-modernization", variant: "outline" },
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

/** Compare page when zero finalized reviews exist. */
export const COMPARE_ZERO_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-zero-finalized-empty-state",
  title: "No finalized reviews available",
  description:
    "You need at least two finalized reviews before ArchLucid can compare changes over time.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/architecture/reviews/new", variant: "primary" },
    { label: "Open reviews", href: "/architecture/reviews", variant: "outline" },
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

/** SCIM token list when no inbound provisioning tokens exist yet. */
export const SCIM_NO_TOKENS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "scim-no-tokens-empty-state",
  title: "No active SCIM tokens",
  description: "Create a token above to begin configuring automated user and group provisioning.",
};

/** Identity provider catalog when hosting configuration has not produced rows yet. */
export const IDENTITY_PROVIDERS_CATALOG_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "identity-providers-catalog-empty-state",
  title: "No identity provider catalog rows yet",
  description:
    "OIDC and SAML settings are configured in your hosting environment. Use the SSO wizard for guided tenant setup; this read-only table populates when values are present.",
  actions: [
    { label: "Open SSO wizard", href: "/administration/identity/sso-wizard", variant: "primary" },
    { label: "SCIM provisioning", href: "/administration/scim-provisioning", variant: "outline" },
  ],
};

/** Decision register when no signed decisions exist for the workspace. */
export const DECISION_REGISTER_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "decision-register-empty-state",
  title: "No architecture decisions yet",
  description:
    "Finalize a review to lock its signed review record. Architecture decisions from that package then appear here with findings and evidence lineage.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
    { label: "Start architecture review", href: "/architecture/reviews/new", variant: "outline" },
    { label: "Open governance workflow", href: GOVERNANCE_APPROVAL_QUEUE_PATH, variant: "outline" },
  ],
};

/** Executive reviews index when no finalized packages exist. */
export const EXECUTIVE_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "executive-reviews-empty-state",
  title: "No finalized reviews yet",
  description:
    "Finalized reviews appear here after you finalize the review and lock the architecture review.",
  actions: [
    { label: "See a completed sample review", href: "/see-it", variant: "primary" },
    { label: "Start a review", href: "/architecture/reviews/new", variant: "outline" },
  ],
};

/** Standards & rules register when no rules apply to the current review scope. */
export const STANDARDS_RULES_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "standards-rules-empty-state",
  title: STANDARDS_RULES_EMPTY_HEADING,
  description: STANDARDS_RULES_EMPTY_BODY,
  actions: [
    { label: "Open policy packs", href: "/governance/policy-packs", variant: "primary" },
    {
      label: "View review evidence",
      href: `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline",
    },
  ],
};

/** Governance findings queue when rows exist but the active filter hides all of them. */
export const GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT: EnterpriseCompactEmptyStateProps =
  buildOperatorFilteredEmptyCompact({
    testId: "governance-findings-filter-no-match-empty-state",
    nounPhrase: "risks",
    description: "Try All or choose a different operational filter to see findings in the register.",
    actions: [],
  });

/** Governance findings queue when the register fetch failed — distinct from a genuinely empty register. */
export const GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-findings-load-failed",
  title: "Could not load architecture risk register",
  description:
    "The risk register did not load for this workspace. Your existing findings are unchanged — retry the load or check connectivity before navigating away.",
  actions: [],
};

/** Run detail deliverables panel before the review is finalized. */
export const RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "run-deliverables-pending-finalize-empty-state",
  title: "No deliverables yet",
  description:
    "Signed deliverables appear here after you finalize the review on review detail. Until then, findings and evidence remain on the review.",
  actions: [],
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

/** Alert rules Conditions tab when no rules exist yet (TB-1555 hub-zone preset). */
export const ALERT_RULES_LIST_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = buildOperatorHubZoneEmptyCompact(
  "alert rules",
  {
    testId: "alert-rules-empty",
    description: ALERT_RULES_LIST_EMPTY_BODY,
  },
);

/** Advisory Schedules tab when no schedules exist yet (TB-1555 hub-zone preset). */
export const ADVISORY_SCHEDULES_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = buildOperatorHubZoneEmptyCompact(
  "advisory-scan schedules",
  {
    testId: "advisory-schedules-empty",
    description: ADVISORY_SCANS_SCHEDULES_EMPTY_BODY,
  },
);

/** Alerts inbox — status filter yields zero rows while alerts exist (TB-1555 filtered preset). */
export const ALERTS_INBOX_FILTERED_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_FILTERED_TITLE,
  description: ALERTS_EMPTY_FILTERED_BODY,
  actions: [
    { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
      variant: "outline",
    },
  ],
};

/** Alerts inbox — workspace has reviews but no alert rules (TB-1555 prerequisite preset). */
export const ALERTS_INBOX_NO_RULES_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_NO_RULES_TITLE,
  description: ALERTS_EMPTY_NO_RULES_BODY,
  actions: [
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
      variant: "primary",
    },
    {
      label: ALERTS_CONFIGURE_RULES_LINK_LABEL,
      href: governanceAlertRulesTabHref("rules"),
      variant: "outline",
    },
  ],
};

/** Alerts inbox — workspace has rules but no reviews yet (TB-1555 prerequisite preset). */
export const ALERTS_INBOX_NO_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_NO_REVIEWS_TITLE,
  description: ALERTS_EMPTY_NO_REVIEWS_BODY,
  actions: [
    {
      label: ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
      href: ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
      variant: "primary",
    },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
      variant: "outline",
    },
  ],
};

/** Alerts inbox — healthy workspace with no open alerts (TB-1555 collection preset). */
export const ALERTS_INBOX_HEALTHY_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "alerts-inbox-empty-state",
  title: ALERTS_EMPTY_HEALTHY_TITLE,
  description: ALERTS_EMPTY_HEALTHY_BODY,
  actions: [
    { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
      variant: "outline",
    },
  ],
};
