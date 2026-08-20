import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — governance workflow deferred chunk catalog. */
export const GOVERNANCE_WORKFLOW_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "governance-workflow-overview-panel",
    label: "Loading governance overview",
    variant: "panel",
    modulePath: "@/app/(operator)/governance/_sections/GovernanceOverviewPanel",
    exportName: "GovernanceOverviewPanel",
  },
  {
    id: "governance-workflow-review-context-bar",
    label: "Loading review context",
    variant: "compact",
    modulePath: "@/app/(operator)/governance/_sections/GovernanceReviewContextBar",
    exportName: "GovernanceReviewContextBar",
  },
  {
    id: "governance-workflow-approvals-list",
    label: "Loading approval requests",
    variant: "section",
    modulePath: "@/app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList",
    exportName: "GovernanceWorkflowApprovalsList",
  },
] as const;
