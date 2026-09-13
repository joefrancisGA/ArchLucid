import type { GovernanceMutationReversibilityId } from "@/lib/mutation-reversibility-registry";

export type InhabitDispositionAmendMountedControlSurface = {
  readonly mutationId: GovernanceMutationReversibilityId;
  readonly sourceRoot: string;
  /** At least one marker must appear in the success-path source file. */
  readonly requiredSuccessMarkers: readonly string[];
};

/**
 * IH-039 — Working finding disposition success must mount row amend or inspect history.
 * Shrink-only inventory: add surfaces when new toast-only success paths appear.
 */
export const INHABIT_DISPOSITION_AMEND_MOUNTED_CONTROL_SURFACES: readonly InhabitDispositionAmendMountedControlSurface[] =
  [
    {
      mutationId: "governance_bulk_disposition",
      sourceRoot: "components/governance/findings/GovernanceFindingsList.tsx",
      requiredSuccessMarkers: ["FindingDispositionRecordCorrectionControl", "ReversibleMutationSuccessCallout"],
    },
    {
      mutationId: "governance_keyboard_finding_disposition",
      sourceRoot: "components/governance/findings/FindingKeyboardTriageHost.tsx",
      requiredSuccessMarkers: ["onRecordCorrection", "GovernanceRecordCorrectionDialog"],
    },
    {
      mutationId: "governance_keyboard_finding_disposition",
      sourceRoot: "components/governance/findings/GovernanceFindingRow.tsx",
      requiredSuccessMarkers: ["FindingDispositionRecordCorrectionControl"],
    },
    {
      mutationId: "governance_keyboard_finding_disposition",
      sourceRoot: "components/governance/findings/GovernanceFindingTriagePanel.tsx",
      requiredSuccessMarkers: ["FindingDispositionHistorySection", "FindingDispositionRecordCorrectionControl"],
    },
    {
      mutationId: "governance_keyboard_finding_disposition",
      sourceRoot: "app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/FindingInspectDispositionForm.tsx",
      requiredSuccessMarkers: ["FindingDispositionRecordCorrectionControl", "finding-inspect-disposition-history"],
    },
  ];
