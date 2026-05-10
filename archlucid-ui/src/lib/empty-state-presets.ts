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
    "Core Pilot path: create an architecture review request, let the pipeline finish, finalize when ready, then open your review package. You can start here, use Getting started, or submit via the CLI or API.",
  actions: [
    { label: "Create request", href: "/reviews/new" },
    { label: "Getting started", href: "/getting-started", variant: "outline" },
    { label: "Onboarding", href: "/onboarding", variant: "outline" },
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
  title: "No graph on screen yet",
  description:
    "Pick a committed review above, keep Review trail selected, then choose Load graph. If the list is empty, start from reviews or Core Pilot: create a request, finish the pipeline, then return here.",
  actions: [
    { label: "View reviews list", href: "/reviews?projectId=default" },
    { label: "Getting started", href: "/getting-started", variant: "outline" },
  ],
};

export const COMPARE_WAITING: EmptyStateProps = {
  icon: GitCompareArrows,
  title: "Waiting for both review IDs",
  description:
    "Enter a base and target review ID to diff manifests and findings. Prefill with query parameters leftRunId and rightRunId, or copy IDs from the review header or list.",
  actions: [
    { label: "View reviews list", href: "/reviews?projectId=default" },
    { label: "Open Compare", href: "/compare", variant: "outline" },
  ],
};

export const PLANNING_EMPTY: EmptyStateProps = {
  icon: BarChart3,
  title: "No themes or plans in this scope yet",
  description:
    "59R themes and improvement plans show here when persisted for the current tenant / workspace / project. Scope follows operator defaults unless you set proxy overrides. Run a committed review first if this tenant is new.",
  actions: [
    { label: "View reviews", href: "/reviews?projectId=default" },
    { label: "Product learning", href: "/product-learning", variant: "outline" },
  ],
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
