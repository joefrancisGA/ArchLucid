import type { WizardFormValues } from "@/lib/wizard-schema";

/** RHF field groups validated before leaving each step (0 = preset; 6 = pipeline — N/A for Next). */
export const WIZARD_STEP_FIELD_GROUPS: Record<number, (keyof WizardFormValues)[] | null> = {
  0: null,
  1: ["systemName", "environment", "cloudProvider", "priorManifestVersion", "description", "inlineRequirements"],
  2: ["constraints", "requiredCapabilities", "assumptions"],
  3: null,
  4: [
    "policyReferences",
    "topologyHints",
    "securityBaselineHints",
    "documents",
    "infrastructureDeclarations",
  ],
  5: null,
  6: null,
};

/**
 * UI step index for `NewRunWizardClient` — maps baseline-first (`?baseline=1`) steps onto
 * {@link WIZARD_STEP_FIELD_GROUPS} (baseline inserts ZIP at UI step 1; identity shifts to UI step 2).
 */
export function getWizardStepFieldGroup(
  stepIndex: number,
  baselineFirst: boolean,
): (keyof WizardFormValues)[] | null {
  if (!baselineFirst) {
    const legacy = WIZARD_STEP_FIELD_GROUPS[stepIndex];

    return legacy ?? null;
  }

  if (stepIndex <= 1) {
    return null;
  }

  const legacyIndex = stepIndex - 1;

  return WIZARD_STEP_FIELD_GROUPS[legacyIndex] ?? null;
}
