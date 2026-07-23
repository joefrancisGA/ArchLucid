import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import {
  BUYER_START_ARCHITECTURE_REVIEW_CTA,
  OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_ARCHIVED_EMPTY_TITLE,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer-polish-copy";
import {
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
} from "@/lib/empty-state-presets";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** Reviews list when the project has zero reviews. */
export const RUNS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "runs-list-empty-state",
  title: "No reviews yet",
  description:
    "Start an architecture review to gather evidence, evaluate findings, and record decisions. Or explore the sample review.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/reviews/new", variant: "primary" },
    { label: AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL, href: "/reviews/claims-intake-modernization", variant: "outline" },
  ],
};

/** Operator home reviews zone — compact empty state without duplicating hero actions. */
export const OPERATOR_HOME_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "operator-home-workspace-empty-state",
  title: OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
  description: OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  actions: [
    {
      label: OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
      href: inAppHelpHref("core-pilot"),
      variant: "outline",
    },
  ],
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
    "Try different wording, clear the review filter, or ensure your workspace has committed review evidence indexed for search.",
  actions: [
    { label: "Open Ask", href: "/ask", variant: "outline" },
    { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" },
  ],
};

/** Planning themes/plans empty for current scope. */
export const PLANNING_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "planning-empty-state",
  title: "No improvement plans yet",
  description:
    "Capture review feedback or run pilot feedback analysis to generate themes and prioritized plans.",
  actions: [
    { label: "Capture review feedback", href: "/product-learning", variant: "primary" },
    { label: "View reviews", href: "/reviews", variant: "outline" },
  ],
};

/** Compare page before both reviews are selected. */
export const COMPARE_WAITING_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/reviews?projectId=default", variant: "primary" },
  ],
};

/** Compare page when zero finalized reviews exist. */
export const COMPARE_ZERO_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-zero-finalized-empty-state",
  title: "No finalized reviews available",
  description:
    "You need at least two finalized reviews before ArchLucid can compare changes over time.",
  actions: [
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/reviews/new", variant: "primary" },
    { label: "Open reviews", href: "/reviews?projectId=default", variant: "outline" },
  ],
};

/** Compare page when fewer than two finalized reviews exist. */
export const COMPARE_INSUFFICIENT_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-insufficient-finalized-empty-state",
  title: "One finalized review available",
  description: "Finalize one more review to compare changes over time.",
  actions: [
    { label: "Open reviews", href: "/reviews?projectId=default", variant: "primary" },
    { label: BUYER_START_ARCHITECTURE_REVIEW_CTA, href: "/reviews/new", variant: "outline" },
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
    { label: "Open SSO wizard", href: "/settings/identity/sso-wizard", variant: "primary" },
    { label: "SCIM provisioning", href: "/settings/scim-provisioning", variant: "outline" },
  ],
};

/** Decision register when no signed decisions exist for the workspace. */
export const DECISION_REGISTER_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "decision-register-empty-state",
  title: "No signed decisions yet",
  description:
    "Finalize a review to create signed architecture decisions with supporting findings and evidence lineage.",
  actions: [
    { label: "Open reviews", href: "/reviews?projectId=default", variant: "primary" },
    { label: "Start architecture review", href: "/reviews/new", variant: "outline" },
    { label: "Open governance workflow", href: "/governance", variant: "outline" },
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
    { label: "Start a review", href: "/reviews/new", variant: "outline" },
  ],
};

/** Governance findings queue when rows exist but the active filter hides all of them. */
export const GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "governance-findings-filter-no-match-empty-state",
  title: "No risks match this filter",
  description: "Try All or choose a different operational filter to see findings in the register.",
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
    { label: "Open reviews", href: "/reviews?projectId=default", variant: "primary" },
  ],
};
