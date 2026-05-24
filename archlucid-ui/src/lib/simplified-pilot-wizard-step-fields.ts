import type { WizardFormValues } from "@/lib/wizard-schema";

/** RHF field groups validated before leaving each simplified pilot step (0 = ZIP upload — optional). */
export const SIMPLIFIED_PILOT_WIZARD_STEP_FIELD_GROUPS: Record<number, (keyof WizardFormValues)[] | null> = {
  0: null,
  1: ["systemName", "environment", "cloudProvider", "priorManifestVersion", "description", "inlineRequirements"],
  2: null,
};
