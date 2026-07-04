import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL, OPERATOR_HOME_WORKSPACE_EMPTY_TITLE } from "@/lib/buyer-polish-copy";

/** Reviews list when the project has zero review packages. */
export const RUNS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "runs-list-empty-state",
  title: "No review packages yet",
  description:
    "Start an architecture review to generate a package with findings, evidence, and exports. Or run a one-click demo review to see policy-aware findings immediately, or load the sample workspace for executive ROI.",
  actions: [
    { label: "Start architecture review", href: "/reviews/new", variant: "primary" },
    { label: "View sample package", href: "/reviews/claims-intake-modernization", variant: "outline" },
  ],
};

/** Operator home reviews zone — hero CTAs above; demo seed below when the live list is empty. */
export const OPERATOR_HOME_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "operator-home-workspace-empty-state",
  title: OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
  description:
    `Your workspace has no committed reviews yet. Run a one-click demo review to see policy-aware findings, load the ${BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL} workspace for portfolio ROI, or start a review from the actions above.`,
};

/** Semantic search returned no hits. */
export const SEARCH_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "search-empty-state",
  title: "No matches for that query",
  description:
    "Try different wording, clear the review package filter, or ensure your workspace has committed review evidence indexed for search.",
  actions: [
    { label: "Open Ask", href: "/ask", variant: "outline" },
    { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" },
  ],
};

/** Planning themes/plans empty for current scope. */
export const PLANNING_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "planning-empty-state",
  title: "No themes or plans in this scope yet",
  description:
    "Feedback themes and improvement plans show here when persisted for the current tenant / workspace / project. Scope follows workspace defaults unless you set proxy overrides. Run a committed review first if this tenant is new.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default", variant: "primary" },
    { label: "Pilot feedback", href: "/product-learning", variant: "outline" },
  ],
};

/** Compare page before both reviews are selected. */
export const COMPARE_WAITING_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
  ],
};

/** Compare page when zero finalized review packages exist. */
export const COMPARE_ZERO_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-zero-finalized-empty-state",
  title: "No finalized reviews available",
  description:
    "You need at least two finalized review packages before ArchLucid can compare changes over time.",
  actions: [
    { label: "Start review", href: "/reviews/new", variant: "primary" },
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "outline" },
  ],
};

/** Compare page when fewer than two finalized review packages exist. */
export const COMPARE_INSUFFICIENT_FINALIZED_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-insufficient-finalized-empty-state",
  title: "One finalized review available",
  description: "Finalize one more review package to compare changes over time.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
    { label: "Start review", href: "/reviews/new", variant: "outline" },
  ],
};

/** SCIM token list when no inbound provisioning tokens exist yet. */
export const SCIM_NO_TOKENS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "scim-no-tokens-empty-state",
  title: "No SCIM tokens yet",
  description:
    "Issue a bearer token, verify connectivity against ServiceProviderConfig, then configure your identity provider's SCIM provisioning app.",
  actions: [
    { label: "Open SSO wizard", href: "/settings/identity/sso-wizard", variant: "outline" },
  ],
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
    "Finalize a review package to record architecture decisions here. Each entry links to the signed review record and supporting findings.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
    { label: "Open governance workflow", href: "/governance", variant: "outline" },
  ],
};

/** Executive reviews index when no finalized packages exist. */
export const EXECUTIVE_REVIEWS_EMPTY_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "executive-reviews-empty-state",
  title: "No finalized reviews yet",
  description:
    "Finalized reviews appear here after you finalize the review and lock the architecture package.",
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

/** Run detail deliverables panel before the review package is finalized. */
export const RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "run-deliverables-pending-finalize-empty-state",
  title: "No deliverables yet",
  description:
    "Signed deliverables appear here after you finalize the review package on review detail. Until then, findings and evidence remain on the review.",
  actions: [],
};

/** Buyer-polished compare idle state. */
export const COMPARE_WAITING_BUYER_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
  ],
};
