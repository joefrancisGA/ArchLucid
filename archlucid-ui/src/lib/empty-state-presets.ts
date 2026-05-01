import { BarChart3, Bell, FileText, GitCompareArrows, Network, Shield } from "lucide-react";

import type { EmptyStateProps } from "@/components/EmptyState";
import {
  governanceWorkflowIdleGettingStartedOperator,
  governanceWorkflowIdleGettingStartedReader,
} from "@/lib/governance-workflow-empty-guidance";

export { SEARCH_EMPTY } from "./search-empty-preset";

export const RUNS_EMPTY: EmptyStateProps = {
  icon: FileText,
  title: "No architecture runs yet",
  description:
    "Create a request to generate your first architecture manifest, surfaced findings, and exportable artifact bundle. You can also submit via the CLI or API.",
  actions: [
    { label: "Create request", href: "/reviews/new" },
    { label: "Onboarding", href: "/onboarding", variant: "outline" },
  ],
  helpTopicPath: "creating-runs",
};

export const ALERTS_EMPTY_FILTERED: EmptyStateProps = {
  icon: Bell,
  title: "No alerts for this filter",
  description:
    "Try another status or refresh. Alerts appear after rules evaluate findings from completed reviews.",
  actions: [
    { label: "Set up alert rules", href: "/alerts?tab=rules" },
    { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" },
  ],
  helpTopicPath: "alerts",
};

export const GRAPH_IDLE: EmptyStateProps = {
  icon: Network,
  title: "No graph on screen yet",
  description:
    "Choose a review above, keep Review trail graph selected for the default story, then use Load graph.",
  actions: [{ label: "View reviews list", href: "/reviews?projectId=default", variant: "outline" }],
};

export const COMPARE_WAITING: EmptyStateProps = {
  icon: GitCompareArrows,
  title: "Waiting for both review IDs",
  description:
    "Enter a base and target review ID before comparing. Query parameters leftRunId and rightRunId prefill these fields. Get IDs from Reviews or the Compare shortcut on review detail.",
  actions: [{ label: "View reviews list", href: "/reviews?projectId=default", variant: "outline" }],
};

export const PLANNING_EMPTY: EmptyStateProps = {
  icon: BarChart3,
  title: "No themes or plans in this scope yet",
  description:
    "When 59R themes and improvement plans are persisted for the current tenant / workspace / project, they will appear here. Scope follows the operator shell defaults unless you configure proxy scope overrides.",
  actions: [{ label: "View pilot feedback", href: "/product-learning", variant: "outline" }],
};

export const GOVERNANCE_WORKFLOW_IDLE: EmptyStateProps = {
  icon: Shield,
  title: "Load a review to see workflow rows",
  description:
    "Pick a run under Approval requests for this review, then Load — approvals, promotions, and activations appear for that review.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default" },
    { label: "Governance findings", href: "/governance/findings", variant: "outline" },
    { label: "Policy packs", href: "/policy-packs", variant: "outline" },
  ],
  helpTopicPath: "governance",
  gettingStarted: governanceWorkflowIdleGettingStartedOperator,
};

/** Idle state when the principal is below Execute: inspection-first copy (mutations stay API-gated). */
export const GOVERNANCE_WORKFLOW_IDLE_READER: EmptyStateProps = {
  icon: Shield,
  title: "Inspect review-scoped workflow",
  description:
    "Choose a review under Approval requests and click Load to review approvals, promotions, and activations for that run.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" },
    { label: "Governance findings", href: "/governance/findings", variant: "outline" },
  ],
  helpTopicPath: "governance",
  gettingStarted: governanceWorkflowIdleGettingStartedReader,
};
