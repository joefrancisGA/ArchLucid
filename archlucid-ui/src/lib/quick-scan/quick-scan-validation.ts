import {
  QUICK_SCAN_ARCHITECTURE_CONCERNS,
  QUICK_SCAN_MAX_CONCERNS,
  QUICK_SCAN_MAX_DESCRIPTION,
  QUICK_SCAN_MAX_SYSTEM_NAME,
  QUICK_SCAN_PRIMARY_ENVIRONMENTS,
  type QuickScanArchitectureConcernValue,
  type QuickScanPrimaryEnvironmentValue,
} from "./quick-scan-constants";

export type QuickScanFormValues = {
  systemName: string;
  primaryEnvironment: QuickScanPrimaryEnvironmentValue | "";
  primaryEnvironmentOther: string;
  description: string;
  architectureConcerns: QuickScanArchitectureConcernValue[];
};

export type QuickScanFieldErrors = {
  systemName?: string;
  primaryEnvironment?: string;
  description?: string;
  architectureConcerns?: string;
};

const allowedEnvironments = new Set(
  QUICK_SCAN_PRIMARY_ENVIRONMENTS.map((entry) => entry.value),
);

const allowedConcerns = new Set(
  QUICK_SCAN_ARCHITECTURE_CONCERNS.map((entry) => entry.value),
);

export function validateQuickScanForm(values: QuickScanFormValues): QuickScanFieldErrors {
  const errors: QuickScanFieldErrors = {};
  const systemName = values.systemName.trim();

  if (systemName.length === 0) {
    errors.systemName = "System name is required.";
  } else if (systemName.length > QUICK_SCAN_MAX_SYSTEM_NAME) {
    errors.systemName = `System name must be ${QUICK_SCAN_MAX_SYSTEM_NAME} characters or fewer.`;
  }

  if (!allowedEnvironments.has(values.primaryEnvironment as QuickScanPrimaryEnvironmentValue)) {
    errors.primaryEnvironment = "Select a primary environment.";
  }

  const description = values.description.trim();

  if (description.length === 0) {
    errors.description = "Describe the system so ArchLucid can analyze it.";
  } else if (description.length > QUICK_SCAN_MAX_DESCRIPTION) {
    errors.description = `Description must be ${QUICK_SCAN_MAX_DESCRIPTION} characters or fewer.`;
  }

  if (values.architectureConcerns.length > QUICK_SCAN_MAX_CONCERNS) {
    errors.architectureConcerns = `Select at most ${QUICK_SCAN_MAX_CONCERNS} concerns.`;
  } else if (values.architectureConcerns.some((concern) => !allowedConcerns.has(concern))) {
    errors.architectureConcerns = "One or more selected concerns are not supported.";
  }

  return errors;
}

export function quickScanIncompleteReason(errors: QuickScanFieldErrors): string | null {
  if (errors.systemName) {
    return errors.systemName;
  }

  if (errors.primaryEnvironment) {
    return errors.primaryEnvironment;
  }

  if (errors.description) {
    return errors.description;
  }

  if (errors.architectureConcerns) {
    return errors.architectureConcerns;
  }

  return null;
}

export function buildQuickScanRequestBody(values: QuickScanFormValues) {
  return {
    systemName: values.systemName.trim(),
    primaryEnvironment: values.primaryEnvironment,
    primaryEnvironmentOther:
      values.primaryEnvironment === "Other" && values.primaryEnvironmentOther.trim().length > 0
        ? values.primaryEnvironmentOther.trim()
        : undefined,
    description: values.description.trim(),
    architectureConcerns: values.architectureConcerns,
  };
}
