import type { GovernanceMutationReversibilityId } from "@/lib/mutation-reversibility-registry";
import {
  MUTATION_REVERSIBILITY_REGISTRY,
  mutationSupportsAmend,
} from "@/lib/mutation-reversibility-registry";

export type MutationAmendableMountedControlSurface = {
  readonly mutationId: GovernanceMutationReversibilityId;
  readonly sourceRoot: string;
  /** At least one marker must appear in the success-path source file. */
  readonly requiredSuccessMarkers: readonly string[];
};

/** Amendable registry ids and the UI surfaces that must mount record-correction controls (LD-05). */
export const MUTATION_AMENDABLE_MOUNTED_CONTROL_SURFACES: readonly MutationAmendableMountedControlSurface[] =
  [
    {
      mutationId: "governance_quick_approve",
      sourceRoot: "components/governance/GovernanceQuickApproveButton.tsx",
      requiredSuccessMarkers: ["onRecordCorrection", "GovernanceRecordCorrectionDialog"],
    },
    {
      mutationId: "governance_workflow_approve",
      sourceRoot: "app/(operator)/governance/_sections/GovernanceWorkflowMutationHost.tsx",
      requiredSuccessMarkers: ["onRecordCorrection", "governance_workflow_approve"],
    },
    {
      mutationId: "governance_workflow_reject",
      sourceRoot: "app/(operator)/governance/_sections/GovernanceWorkflowMutationHost.tsx",
      requiredSuccessMarkers: ["onRecordCorrection", "governance_workflow_reject"],
    },
    {
      mutationId: "governance_workflow_promote",
      sourceRoot: "app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection.tsx",
      requiredSuccessMarkers: ["GovernanceRecordCorrectionInlineControl", "governance_workflow_promote"],
    },
    {
      mutationId: "governance_workflow_activate",
      sourceRoot: "app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection.tsx",
      requiredSuccessMarkers: ["GovernanceRecordCorrectionInlineControl", "governance_workflow_activate"],
    },
    {
      mutationId: "governance_bulk_disposition",
      sourceRoot: "components/governance/findings/GovernanceFindingsList.tsx",
      requiredSuccessMarkers: ["onRecordCorrection", "GovernanceRecordCorrectionDialog"],
    },
    {
      mutationId: "governance_keyboard_finding_disposition",
      sourceRoot: "components/governance/findings/FindingKeyboardTriageHost.tsx",
      requiredSuccessMarkers: ["onRecordCorrection", "GovernanceRecordCorrectionDialog"],
    },
  ];

export function listAmendableRegistryMutationIds(): GovernanceMutationReversibilityId[] {
  return (Object.keys(MUTATION_REVERSIBILITY_REGISTRY) as GovernanceMutationReversibilityId[]).filter((mutationId) =>
    mutationSupportsAmend(mutationId),
  );
}
