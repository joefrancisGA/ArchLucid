import type { EnterpriseStatusKind } from "@/lib/design-tokens";

import type { GovernanceSetupStepStatus } from "./governance-setup-guide-types";

export type GovernanceSetupStepStatusPresentation = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

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
  complete: boolean,
): GovernanceSetupStepStatusPresentation {
  if (complete) {
    return { kind: "ready", label: "Complete" };
  }

  return { kind: "draft", label: "Pending" };
}
