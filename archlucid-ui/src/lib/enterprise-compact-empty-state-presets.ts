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
    "59R themes and improvement plans show here when persisted for the current tenant / workspace / project. Scope follows operator defaults unless you set proxy overrides. Run a committed review first if this tenant is new.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default", variant: "primary" },
    { label: "Product learning", href: "/product-learning", variant: "outline" },
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

/** Buyer-polished compare idle state. */
export const COMPARE_WAITING_BUYER_COMPACT: EnterpriseCompactEmptyStateProps = {
  testId: "compare-waiting-empty-state",
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
  ],
};
