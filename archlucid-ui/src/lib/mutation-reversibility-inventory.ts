import type { GovernanceMutationReversibilityId } from "@/lib/mutation-reversibility-registry";

export type MutationReversibilityGuardedConfirmSurface = {
  readonly sourceRoot: string;
  readonly mutationId: GovernanceMutationReversibilityId;
};

/** Governed mutation confirm surfaces that must reference the reversibility registry (TB-2148). */
export const MUTATION_REVERSIBILITY_GUARDED_CONFIRM_SURFACES: readonly MutationReversibilityGuardedConfirmSurface[] =
  [
    {
      sourceRoot: "components/governance/GovernanceQuickApproveDialog.tsx",
      mutationId: "governance_quick_approve",
    },
    {
      sourceRoot: "app/(operator)/governance/_sections/GovernanceWorkflowDialogs.tsx",
      mutationId: "governance_workflow_promote",
    },
    {
      sourceRoot: "app/(operator)/governance/_sections/GovernanceWorkflowApprovalsList.tsx",
      mutationId: "governance_workflow_approve",
    },
    {
      sourceRoot: "components/usability/GovernanceFindingsBulkActions.tsx",
      mutationId: "governance_bulk_disposition",
    },
    {
      sourceRoot: "components/governance/findings/FindingKeyboardTriageHost.tsx",
      mutationId: "governance_keyboard_finding_disposition",
    },
    {
      sourceRoot: "app/(operator)/governance/policy-packs/_sections/PolicyPacksLifecycleSection.tsx",
      mutationId: "governance_policy_pack_publish",
    },
  ];
