import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  GOVERNANCE_SETUP_GUIDE_STEPS,
  isGovernanceFoundationIndicatorComplete,
} from "./governance-setup-guide-steps";
import { presentGovernanceFoundationIndicatorStatus } from "./governance-setup-step-status-present";
import type {
  GovernanceSetupFoundationIndicator,
  GovernanceSetupStepDefinition,
  GovernanceSetupStepStatus,
} from "./governance-setup-guide-types";
import { shouldShowGovernanceSetupFoundationPanel } from "./should-show-governance-setup-foundation-panel";

type GovernanceSetupFoundationPanelProps = {
  readonly indicators: readonly GovernanceSetupFoundationIndicator[];
  readonly stepStatuses: readonly GovernanceSetupStepStatus[];
  readonly steps?: readonly GovernanceSetupStepDefinition[];
};

function resolveFoundationIndicatorPresentationInput(
  indicator: GovernanceSetupFoundationIndicator,
  stepStatuses: readonly GovernanceSetupStepStatus[],
  steps: readonly GovernanceSetupStepDefinition[],
): "complete" | "tracked-incomplete" | "untracked" {
  const step = steps[indicator.stepIndex];

  if (step !== undefined && !step.tracked) {
    return "untracked";
  }

  if (isGovernanceFoundationIndicatorComplete(indicator, stepStatuses)) {
    return "complete";
  }

  return "tracked-incomplete";
}

export function GovernanceSetupFoundationPanel({
  indicators,
  stepStatuses,
  steps = GOVERNANCE_SETUP_GUIDE_STEPS,
}: GovernanceSetupFoundationPanelProps) {
  if (!shouldShowGovernanceSetupFoundationPanel(indicators, stepStatuses)) {
    return null;
  }

  return (
    <section
      aria-labelledby="governance-foundation-heading"
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="governance-setup-foundation-panel"
    >
      <h2
        id="governance-foundation-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Governance foundation
      </h2>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {indicators.map((indicator) => {
          const presentationInput = resolveFoundationIndicatorPresentationInput(
            indicator,
            stepStatuses,
            steps,
          );
          const presentation = presentGovernanceFoundationIndicatorStatus(presentationInput);

          return (
            <li
              key={indicator.id}
              className="flex flex-wrap items-center justify-between gap-2"
              data-testid={`governance-foundation-${indicator.id}`}
            >
              <span className={cn("text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                {indicator.label}
              </span>
              <StatusTag kind={presentation.kind} label={presentation.label} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
