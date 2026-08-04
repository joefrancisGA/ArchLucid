export type GovernanceSetupStepStatus = "not-started" | "in-progress" | "complete";

export type GovernanceSetupStepDefinition = {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  /** Outcome unlocked when this step is done — value framing beside the activity CTA. */
  readonly outcome: string;
  readonly primaryActionLabel: string;
  readonly primaryActionHref: string;
  readonly secondaryActionLabel?: string;
  readonly secondaryActionHref?: string;
};

export type GovernanceSetupFoundationIndicator = {
  readonly id: string;
  readonly label: string;
  readonly stepIndex: number;
};

export type GovernanceSetupGuideViewModel = {
  readonly stepStatuses: readonly GovernanceSetupStepStatus[];
  readonly steps: readonly GovernanceSetupStepDefinition[];
  readonly foundationIndicators: readonly GovernanceSetupFoundationIndicator[];
};
