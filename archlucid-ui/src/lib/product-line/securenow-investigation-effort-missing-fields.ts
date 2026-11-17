import type { SecureNowInvestigationEffortInputFields } from "@/lib/product-line/securenow-investigation-effort-input-storage";

export const SECURENOW_INVESTIGATION_EFFORT_FIELD_LABELS: Readonly<
  Record<keyof SecureNowInvestigationEffortInputFields, string>
> = {
  baselineHours: "Baseline hours (B)",
  afterHours: "After-product hours (A)",
  annualInvestigations: "Annual investigations (N)",
  hourlyRate: "Fully loaded hourly rate (R)",
  annualCost: "Annual product and operating cost (C)",
};

function parsePositiveNumber(raw: string): number | null {
  const parsed = Number(raw.trim());

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** Buyer-safe names for inputs that block ROI calculation. */
export function listSecureNowInvestigationEffortMissingFieldLabels(
  inputs: SecureNowInvestigationEffortInputFields,
): readonly string[] {
  const missing: string[] = [];

  if (parsePositiveNumber(inputs.baselineHours) === null) {
    missing.push(SECURENOW_INVESTIGATION_EFFORT_FIELD_LABELS.baselineHours);
  }

  if (parsePositiveNumber(inputs.afterHours) === null) {
    missing.push(SECURENOW_INVESTIGATION_EFFORT_FIELD_LABELS.afterHours);
  }

  if (parsePositiveNumber(inputs.annualInvestigations) === null) {
    missing.push(SECURENOW_INVESTIGATION_EFFORT_FIELD_LABELS.annualInvestigations);
  }

  if (parsePositiveNumber(inputs.hourlyRate) === null) {
    missing.push(SECURENOW_INVESTIGATION_EFFORT_FIELD_LABELS.hourlyRate);
  }

  if (parsePositiveNumber(inputs.annualCost) === null) {
    missing.push(SECURENOW_INVESTIGATION_EFFORT_FIELD_LABELS.annualCost);
  }

  return missing;
}

export function formatSecureNowInvestigationEffortMissingFieldsReason(
  missingLabels: readonly string[],
): string {
  if (missingLabels.length === 0) {
    return "Enter all five inputs with positive numbers.";
  }

  if (missingLabels.length === 1) {
    return `Still needed: ${missingLabels[0]}.`;
  }

  return `Still needed: ${missingLabels.join("; ")}.`;
}