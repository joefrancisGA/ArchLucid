import type { GovernanceSetupStepStatus } from "./governance-setup-guide-types";

export type GovernanceSetupStepCtaVariant = "primary" | "outline";

/** Only the recommended-next step may carry primary weight (TB-1137). */
export function resolveGovernanceSetupStepCtaVariant(args: {
  readonly recommendedNext: boolean;
  readonly status: GovernanceSetupStepStatus;
}): GovernanceSetupStepCtaVariant {
  if (args.recommendedNext) {
    return "primary";
  }

  return "outline";
}
