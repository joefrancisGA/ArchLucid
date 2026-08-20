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
  {
    id: "governance-workflow-submit-section",
    label: "Loading approval submit",
    variant: "panel",
    modulePath: "@/app/(operator)/governance/_sections/GovernanceWorkflowSubmitSection",
    exportName: "GovernanceWorkflowSubmitSection",
  },
  {
    id: "governance-workflow-promotions-activations",
    label: "Loading environment releases",
    variant: "section",
    modulePath: "@/app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection",
    exportName: "GovernanceWorkflowPromotionsActivationsSection",
  },
  {
    id: "governance-workflow-dialogs",
    label: "Loading governance dialogs",
    variant: "panel",
    modulePath: "@/app/(operator)/governance/_sections/GovernanceWorkflowDialogs",
    exportName: "GovernanceWorkflowDialogs",
  },
  {
    id: "governance-workflow-interactive-quickstart",
    label: "Loading governance quickstart",
    variant: "panel",
    modulePath: "@/components/governance/GovernanceInteractiveQuickstartContent",
    exportName: "GovernanceInteractiveQuickstartContent",
  },
  {
    id: "governance-workflow-approval-story-card",
    label: "Loading approval decision record",
    variant: "panel",
    modulePath: "@/components/governance/GovernanceApprovalStoryCard",
    exportName: "GovernanceApprovalStoryCard",
  },
  {
    id: "governance-workflow-advanced-options",
    label: "Loading advanced options",
    variant: "panel",
    modulePath: "@/components/AdvancedOptionsAccordion",
    exportName: "AdvancedOptionsAccordion",
  },
] as const;
