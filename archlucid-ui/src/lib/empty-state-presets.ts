import { BarChart3, Bell, FileText, GitCompareArrows, Network, Shield } from "lucide-react";

import type { EmptyStateProps } from "@/components/EmptyState";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { OPERATOR_GRAPH_IDLE_BODY, OPERATOR_GRAPH_IDLE_TITLE, OPERATOR_GRAPH_WHAT_YOU_WILL_SEE } from "@/lib/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  governanceWorkflowIdleGettingStartedOperator,
  governanceWorkflowIdleGettingStartedReader,
} from "@/lib/governance-workflow-empty-guidance";

export { SEARCH_EMPTY } from "./search-empty-preset";

export const RUNS_EMPTY: EmptyStateProps = {
  icon: FileText,
  title: "No review packages yet",
  description:
    "Start an architecture review to generate a review package with findings, evidence, signed review record, and exports. Or open the sample package to see the completed flow.",
  actions: [
    { label: "Start architecture review", href: "/reviews/new" },
    { label: "View sample package", href: "/reviews/claims-intake-modernization", variant: "outline" },
  ],
  helpTopicPath: "creating-runs",
};

export const ALERTS_EMPTY_FILTERED: EmptyStateProps = {
  icon: Bell,
  title: "No alerts for this filter",
  description:
    "Try another status or time range. Alerts appear when rules evaluate against findings from completed reviews — finish a review package first if you are in an empty tenant.",
  actions: [
    { label: "Set up alert rules", href: "/alerts?tab=rules" },
    { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" },
  ],
  helpTopicPath: "alerts",
};

export const GRAPH_IDLE: EmptyStateProps = {
  icon: Network,
  title: OPERATOR_GRAPH_IDLE_TITLE,
  description: `${OPERATOR_GRAPH_WHAT_YOU_WILL_SEE} ${OPERATOR_GRAPH_IDLE_BODY}`,
  actions: [
    { label: "Start review", href: "/reviews/new" },
    {
      label: "Open sample evidence graph",
      href: `/graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline" as const,
    },
  ],
};

/** Buyer-polished graph idle: no runId/query jargon or signed-manifest shortcut. */
export const GRAPH_IDLE_BUYER: EmptyStateProps = {
  icon: Network,
  title: "No completed review packages yet",
  description:
    "Start a new review, upload evidence, or open the sample evidence graph to see how findings link to decisions and audit records.",
  actions: [
    { label: "Start review", href: "/reviews/new" },
    {
      label: "Open sample evidence graph",
      href: `/graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline" as const,
    },
    { label: "Upload evidence", href: "/reviews/new", variant: "outline" as const },
  ],
};

export const COMPARE_WAITING: EmptyStateProps = {
  icon: GitCompareArrows,
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default" },
  ],
};

/** Buyer-polished compare: no raw IDs or query-parameter instructions. */
export const COMPARE_WAITING_BUYER: EmptyStateProps = {
  icon: GitCompareArrows,
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default" },
  ],
};

export const PLANNING_EMPTY: EmptyStateProps = {
  icon: BarChart3,
  title: "No themes or plans in this scope yet",
  description:
    "Feedback themes and improvement plans show here when persisted for the current tenant / workspace / project. Scope follows workspace defaults unless you set proxy overrides. Run a committed review first if this tenant is new.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default" },
    { label: "Pilot feedback", href: "/product-learning", variant: "outline" },
  ],
};

export const GOVERNANCE_WORKFLOW_IDLE: EmptyStateProps = {
  icon: Shield,
  title: "Load a review to see workflow rows",
  description:
    "Pick a finalized review package under Approval requests, then Load — approvals, releases, and activations appear for that review.",
  actions: [
    { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
    { label: "Risk register", href: "/governance/findings", variant: "outline" },
    { label: "Policy packs", href: "/policy-packs", variant: "outline" },
  ],
  helpTopicPath: "governance",
  gettingStarted: governanceWorkflowIdleGettingStartedOperator,
  secondaryAction: {
    label: "View audit trail →",
    href: auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID),
  },
};

/** Idle state when the principal is below Execute: inspection-first copy (mutations stay API-gated). */
export const GOVERNANCE_WORKFLOW_IDLE_READER: EmptyStateProps = {
  icon: Shield,
  title: "Inspect review-scoped workflow",
  description:
    "Choose a review under Approval requests and click Load to review approvals, promotions, and activations for that run.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" },
    { label: "Risk register", href: "/governance/findings", variant: "outline" },
  ],
  helpTopicPath: "governance",
  gettingStarted: governanceWorkflowIdleGettingStartedReader,
  secondaryAction: {
    label: "View audit trail →",
    href: auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID),
  },
};
