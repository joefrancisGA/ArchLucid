import { isGovernanceFoundationIndicatorComplete } from "./governance-setup-guide-steps";
import type {
  GovernanceSetupFoundationIndicator,
  GovernanceSetupStepStatus,
} from "./governance-setup-guide-types";

/**
 * TB-1138: hide the all-Pending foundation grid under an untouched checklist.
 * Show only after at least one foundation indicator is complete.
 */
export function shouldShowGovernanceSetupFoundationPanel(
  indicators: readonly GovernanceSetupFoundationIndicator[],
  stepStatuses: readonly GovernanceSetupStepStatus[],
): boolean {
  return indicators.some((indicator) =>
    isGovernanceFoundationIndicatorComplete(indicator, stepStatuses),
  );
}
