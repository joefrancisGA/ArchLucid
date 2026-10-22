import type { WizardFormValues } from "@/lib/wizard-schema";

/** Full-wizard step index for optional evidence upload (TB-215). Baseline-first uses ZIP at step 1 instead. */
export const FULL_WIZARD_EVIDENCE_STEP_INDEX = 1;

/** Full-wizard step index for optional ROI baseline capture (TB-238). */
export const FULL_WIZARD_BASELINE_METRICS_STEP_INDEX = 6;

/** RHF field groups validated before leaving each step (0 = preset; 8 = pipeline — N/A for Next). */
export const WIZARD_STEP_FIELD_GROUPS: Record<number, (keyof WizardFormValues)[] | null> = {
  0: null,
  1: null,
  2: ["systemName", "environment", "cloudProvider", "priorManifestVersion", "description", "inlineRequirements"],
  3: ["constraints", "requiredCapabilities", "assumptions"],
  4: null,
  5: [
    "policyReferences",
    "topologyHints",
    "securityBaselineHints",
    "documents",
    "infrastructureDeclarations",
  ],
  6: null,
  7: null,
  8: null,
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
