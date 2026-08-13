import type { EnterpriseStatusKind } from "@/lib/design-tokens";

import { GOVERNANCE_SETUP_FOUNDATION_NOT_TRACKED_STATUS_LABEL } from "./governance-setup-progress-copy";
import type { GovernanceSetupStepStatus } from "./governance-setup-guide-types";

export type GovernanceSetupStepStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export type GovernanceFoundationIndicatorPresentationInput =
  | "complete"
  | "tracked-incomplete"
  | "untracked";

export function presentGovernanceSetupStepStatus(
  status: GovernanceSetupStepStatus,
): GovernanceSetupStepStatusPresentation {
  switch (status) {
    case "complete":
      return { kind: "ready", label: "Complete" };

    case "in-progress":
      return { kind: "in-progress", label: "In progress" };

    case "not-started":
      return { kind: "draft", label: "Not started" };

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function presentGovernanceFoundationIndicatorStatus(
  input: GovernanceFoundationIndicatorPresentationInput,
): GovernanceSetupStepStatusPresentation {
  switch (input) {
    case "complete":
      return { kind: "ready", label: "Complete" };

    case "tracked-incomplete":
      return { kind: "draft", label: "Pending" };

    case "untracked":
      return { kind: "neutral", label: GOVERNANCE_SETUP_FOUNDATION_NOT_TRACKED_STATUS_LABEL };

    default: {
      const exhaustive: never = input;

      return exhaustive;
    }
  }
}
