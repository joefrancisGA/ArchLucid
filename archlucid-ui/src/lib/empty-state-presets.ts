import { BarChart3, Bell, FileText, GitCompareArrows, Network, Shield } from "lucide-react";

import type { EmptyStateProps } from "@/components/EmptyState";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { OPERATOR_GRAPH_IDLE_BODY, OPERATOR_GRAPH_IDLE_TITLE, OPERATOR_GRAPH_WHAT_YOU_WILL_SEE } from "@/lib/buyer-polish-copy";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  governanceWorkflowIdleGettingStartedOperator,
  governanceWorkflowIdleGettingStartedReader,
} from "@/lib/governance/governance-workflow-empty-guidance";

/** Honest qualifier for claims-intake sample CTAs — Azure reference architecture with fabricated data (TB-778). */
export const AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL = "Explore sample review (Azure reference)";

/** Honest qualifier for showcase static demo graph CTAs (TB-778). */
export const AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL = "Open sample evidence graph (Azure reference)";

export { SEARCH_EMPTY } from "./search-empty-preset";

export const RUNS_EMPTY: EmptyStateProps = {
  icon: FileText,
  title: "No reviews yet",
  description:
    "Start an architecture review to gather evidence, evaluate findings, record decisions, and produce exports. Or explore the sample review to see a completed flow.",
  actions: [
    { label: "Start an architecture review", href: "/architecture/reviews/new" },
    { label: AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL, href: "/architecture/reviews/claims-intake-modernization", variant: "outline" },
  ],
  helpTopicPath: "review-guide",
};

export const ALERTS_EMPTY_FILTERED: EmptyStateProps = {
  icon: Bell,
  title: "No alerts for this filter",
  description:
    "Try another status or time range. Alerts appear when rules evaluate against findings from completed reviews — finish a review first if you are in an empty tenant.",
  actions: [
    { label: "Set up alert rules", href: "/governance/alert-rules" },
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
  ],
  helpTopicPath: "alerts",
};

export const GRAPH_IDLE: EmptyStateProps = {
  icon: Network,
  title: OPERATOR_GRAPH_IDLE_TITLE,
  description: `${OPERATOR_GRAPH_WHAT_YOU_WILL_SEE} ${OPERATOR_GRAPH_IDLE_BODY}`,
  actions: [
    { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH },
    {
      label: AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
      href: `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
      variant: "outline" as const,
    },
  ],
};

/** Buyer-polished graph idle: sample graph is the primary next action. */
export const GRAPH_IDLE_BUYER: EmptyStateProps = {
  icon: Network,
  title: "No completed reviews yet",
  description:
    "Complete a review to generate an evidence graph, or open the sample graph to see how findings link to evidence, decisions, and audit records.",
  actions: [
    {
      label: AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
      href: `/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`,
    },
    { label: CREATE_ARCHITECTURE_LABEL, href: ARCHITECTURES_NEW_PATH, variant: "outline" as const },
    { label: "Upload evidence", href: "/architecture/reviews/new", variant: "outline" as const },
  ],
};

export const COMPARE_WAITING: EmptyStateProps = {
  icon: GitCompareArrows,
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews" },
  ],
};

/** Buyer-polished compare: no raw IDs or query-parameter instructions. */
export const COMPARE_WAITING_BUYER: EmptyStateProps = {
  icon: GitCompareArrows,
  title: "Select two reviews to compare",
  description: "Choose a baseline and updated review to continue.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews" },
  ],
};

export const PLANNING_EMPTY: EmptyStateProps = {
  icon: BarChart3,
  title: "No themes or plans in this scope yet",
  description:
    "Feedback themes and improvement plans show here when persisted for the current tenant / workspace / project. Scope follows workspace defaults unless you set proxy overrides. Run a committed review first if this tenant is new.",
  actions: [
    { label: "View reviews", href: "/architecture/reviews" },
    { label: "Pilot feedback", href: "/internal/product-learning", variant: "outline" },
  ],
};

export const GOVERNANCE_WORKFLOW_IDLE: EmptyStateProps = {
  icon: Shield,
  title: "Load a review to see workflow rows",
  description:
    "Pick a finalized review under Approval requests, then Load — approvals, releases, and activations appear for that review.",
  actions: [
    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
    { label: "Findings", href: "/governance/findings", variant: "outline" },
    { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH, variant: "outline" },
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
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
    { label: "Findings", href: "/governance/findings", variant: "outline" },
  ],
  helpTopicPath: "governance",
  gettingStarted: governanceWorkflowIdleGettingStartedReader,
  secondaryAction: {
    label: "View audit trail →",
    href: auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID),
  },
};
