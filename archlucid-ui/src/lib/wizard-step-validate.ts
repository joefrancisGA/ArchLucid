import { z } from "zod";

import { WIZARD_STEP_FIELD_GROUPS } from "@/lib/wizard-step-fields";
import { wizardFormSchema, type WizardFormValues } from "@/lib/wizard-schema";

const stepPickSchema: Record<number, z.ZodTypeAny | null> = {
  0: null,
  1: wizardFormSchema.pick({
    systemName: true,
    environment: true,
    cloudProvider: true,
    priorManifestVersion: true,
    description: true,
    inlineRequirements: true,
  }),
  2: wizardFormSchema.pick({ constraints: true, requiredCapabilities: true, assumptions: true }),
  3: null,
  4: wizardFormSchema.pick({
    policyReferences: true,
    topologyHints: true,
    securityBaselineHints: true,
    documents: true,
    infrastructureDeclarations: true,
  }),
  5: null,
  6: null,
};

export type WizardStepFieldError = { field: string; message: string };

export type ValidateWizardStepOptions = {
  baselineFirst?: boolean;
};

function wizardStepAllowedFields(stepIndex: number, baselineFirst: boolean): (keyof WizardFormValues)[] {
  if (!baselineFirst) {
    return WIZARD_STEP_FIELD_GROUPS[stepIndex] ?? [];
  }

  if (stepIndex <= 1) {
    return [];
  }

  const legacyIndex = stepIndex - 1;

  return WIZARD_STEP_FIELD_GROUPS[legacyIndex] ?? [];
}

function resolvePickSchemaIndex(uiStep: number, baselineFirst: boolean): number | null {
  if (!baselineFirst) {
    if (uiStep <= 0 || uiStep > 6) {
      return null;
    }

    return uiStep;
  }

  if (uiStep < 2) {
    return null;
  }

  if (uiStep > 6) {
    return null;
  }

  return uiStep - 1;
}

/**
 * Per-step Zod `pick` validation. Empty array = valid to advance. Used on Next, not async.
 */
export function validateWizardStep(
  stepIndex: number,
  values: WizardFormValues,
  options?: ValidateWizardStepOptions,
): WizardStepFieldError[] {
  const baselineFirst = options?.baselineFirst === true;
  const pickIndex = resolvePickSchemaIndex(stepIndex, baselineFirst);

  if (pickIndex === null) {
    return [];
  }

  const sub = stepPickSchema[pickIndex];

  if (sub === null || sub === undefined) {
    return [];
  }

  const result = sub.safeParse(values);

  if (result.success) {
    return [];
  }

  const allowed = new Set<string>(wizardStepAllowedFields(stepIndex, baselineFirst) as string[]);
  if (allowed.size === 0) {
    return [];
  }

  const byPath = new Map<string, string>();
  for (const issue of result.error.issues) {
    const root = issue.path[0];

    if (root === undefined || !allowed.has(String(root))) {
      continue;
    }

    const path = issue.path.map((p) => p.toString()).join(".");
    if (!byPath.has(path)) {
      byPath.set(path, issue.message);
    }
  }
  return [...byPath].map(([field, message]) => ({ field, message }));
}

/**
 * True when the current step fails the same Zod partial validation as {@link validateWizardStep}
 * (aligned with Next / Submit gating in NewRunWizardClient).
 */
export function stepHasBlockingFormErrors(
  stepIndex: number,
  values: WizardFormValues,
  baselineFirst: boolean,
): boolean {
  if (baselineFirst) {
    if (stepIndex < 2 || stepIndex > 5 || stepIndex === 1 || stepIndex === 4) {
      return false;
    }
  } else {
    if (stepIndex < 1 || stepIndex > 4 || stepIndex === 3) {
      return false;
    }
  }

  return validateWizardStep(stepIndex, values, { baselineFirst }).length > 0;
}
