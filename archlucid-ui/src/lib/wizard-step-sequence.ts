import type { WizardFormValues } from "@/lib/wizard-schema";

/** One entry in a wizard's step rail: heading label plus the sub-copy shown under it. */
export type WizardStepDefinition = {
  readonly label: string;
  readonly description: string;
};

/** RHF field names validated before leaving a step (see `trigger(fieldGroup)`). */
export type WizardStepFieldGroup = (keyof WizardFormValues)[];

/** Telemetry label used when a step index falls outside the declared step list. */
export const UNKNOWN_WIZARD_STEP_LABEL = "Unknown";

export function clampWizardStepIndex(index: number, stepCount: number): number {
  if (stepCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(0, index), stepCount - 1);
}

export function previousWizardStepIndex(current: number): number {
  return Math.max(0, current - 1);
}

export function nextWizardStepIndex(current: number, stepCount: number): number {
  return clampWizardStepIndex(current + 1, stepCount);
}

export function wizardStepLabelAt(steps: readonly WizardStepDefinition[], index: number): string {
  return steps[index]?.label ?? UNKNOWN_WIZARD_STEP_LABEL;
}

export function isLastWizardStepIndex(index: number, stepCount: number): boolean {
  return index === stepCount - 1;
}

/** Sticky-header sentence, e.g. `Quick start — step 2 of 3: Architecture brief`. */
export function wizardStepHeadline(
  wizardLabel: string,
  index: number,
  steps: readonly WizardStepDefinition[],
): string {
  return `${wizardLabel} — step ${index + 1} of ${steps.length}: ${wizardStepLabelAt(steps, index)}`;
}
