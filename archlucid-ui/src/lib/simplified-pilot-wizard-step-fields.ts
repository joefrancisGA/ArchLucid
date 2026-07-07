import type { WizardFormValues } from "@/lib/wizard-schema";

/** RHF field groups validated before leaving each simplified pilot step (1 = optional evidence — no required fields). */
export const SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS: Record<number, (keyof WizardFormValues)[] | null> = {
  0: ["systemName", "environment", "cloudProvider", "priorManifestVersion", "description", "inlineRequirements"],
  1: null,
  2: null,
  3: null,
};
