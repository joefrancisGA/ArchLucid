import type { WizardFormValues } from "@/lib/wizard-schema";

import { validateWizardStep } from "@/lib/wizard-step-validate";

/** RHF field groups validated before leaving each step (0 = preset; 5 = pipeline — N/A for Next). */
export const WIZARD_STEP_FIELD_GROUPS: Record<number, (keyof WizardFormValues)[] | null> = {
  0: null,
  1: ["systemName", "environment", "cloudProvider", "priorManifestVersion", "description", "inlineRequirements"],
  2: ["constraints", "requiredCapabilities", "assumptions"],
  3: [
    "policyReferences",
    "topologyHints",
    "securityBaselineHints",
    "documents",
    "infrastructureDeclarations",
  ],
  4: null,
  5: null,
};

/**
 * True when the current step fails the same Zod partial validation as {@link validateWizardStep}
 * (aligned with Next / Submit gating in NewRunWizardClient).
 */
export function stepHasBlockingFormErrors(stepIndex: number, values: WizardFormValues): boolean {
  if (stepIndex < 1 || stepIndex > 3) {
    return false;
  }

  return validateWizardStep(stepIndex, values).length > 0;
}
