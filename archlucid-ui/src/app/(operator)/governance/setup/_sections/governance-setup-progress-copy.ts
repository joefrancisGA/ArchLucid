/** User-visible progress summary strings for the governance setup guide. */

export function formatGovernanceSetupTrackedProgressLabel(
  completedCount: number,
  trackedTotalCount: number,
): string {
  return `${completedCount} of ${trackedTotalCount} tracked steps complete`;
}

export function formatGovernanceSetupUntrackedStepsClause(untrackedCount: number): string {
  return `${untrackedCount} step${untrackedCount === 1 ? "" : "s"} you confirm yourself`;
}

/**
 * Renders beside the "n of n tracked steps complete" label and the untracked-count clause, both of
 * which already state the counts. This sentence therefore adds the one thing they omit — *where* the
 * remaining steps get confirmed — instead of restating a number the operator has just read twice.
 */
export const GOVERNANCE_SETUP_ALL_TRACKED_COMPLETE_COACH =
  "Confirm the remaining steps in their linked workspaces." as const;

export const GOVERNANCE_SETUP_STEP_NOT_TRACKED_STATUS_LABEL = "Not tracked" as const;

export const GOVERNANCE_SETUP_STEP_NOT_TRACKED_HELPER =
  "Confirm in the linked workspace — setup does not detect this step." as const;

export const GOVERNANCE_SETUP_FOUNDATION_NOT_TRACKED_STATUS_LABEL = "Not tracked" as const;

export const GOVERNANCE_SETUP_STEP_COMPLETE_SR_LABEL = "Step complete" as const;
