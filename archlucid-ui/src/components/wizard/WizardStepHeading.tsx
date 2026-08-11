"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { wizardStepHeadline, type WizardStepDefinition } from "@/lib/wizard-step-sequence";

export type WizardStepHeadingProps = {
  /** Wizard name shown before the step counter, e.g. `Quick start`. */
  readonly wizardLabel: string;
  readonly stepIndex: number;
  readonly steps: readonly WizardStepDefinition[];
  readonly testId: string;
};

/** Step counter plus the active step's sub-copy, shared by the WizardFormValues wizard family. */
export function WizardStepHeading(props: WizardStepHeadingProps): React.ReactElement {
  const { wizardLabel, stepIndex, steps, testId } = props;

  return (
    <div className="space-y-1" data-testid={testId}>
      <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
        {wizardStepHeadline(wizardLabel, stepIndex, steps)}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{steps[stepIndex]?.description ?? ""}</p>
    </div>
  );
}
