import {
  isSecureNowInvestigationEffortFixtureWorksheet,
  type SecureNowInvestigationEffortInputFields,
} from "@/lib/product-line/securenow-investigation-effort-input-storage";

export type SecureNowInvestigationEffortResultState =
  | { readonly kind: "incomplete"; readonly headline: "ROI not calculated."; readonly reason: string }
  | { readonly kind: "fixture"; readonly headline: "ROI not calculated. Those values are the fixture worksheet." }
  | {
      readonly kind: "calculated";
      readonly headline: "Entered inputs. Not a customer result.";
      readonly gross: number;
      readonly net: number;
      readonly ratio: number;
    };

function parsePositiveNumber(raw: string): number | null {
  const parsed = Number(raw.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function resolveSecureNowInvestigationEffortResultState(
  inputs: SecureNowInvestigationEffortInputFields,
): SecureNowInvestigationEffortResultState {
  const baselineHours = parsePositiveNumber(inputs.baselineHours);
  const afterHours = parsePositiveNumber(inputs.afterHours);
  const annualInvestigations = parsePositiveNumber(inputs.annualInvestigations);
  const hourlyRate = parsePositiveNumber(inputs.hourlyRate);
  const annualCost = parsePositiveNumber(inputs.annualCost);

  if (
    baselineHours === null
    || afterHours === null
    || annualInvestigations === null
    || hourlyRate === null
    || annualCost === null
  ) {
    return {
      kind: "incomplete",
      headline: "ROI not calculated.",
      reason: "Enter all five inputs with positive numbers. Empty or invalid fields stay out of ROI.",
    };
  }

  if (afterHours > baselineHours) {
    return {
      kind: "incomplete",
      headline: "ROI not calculated.",
      reason: "After-product hours must not exceed baseline hours for a positive capacity delta.",
    };
  }

  if (isSecureNowInvestigationEffortFixtureWorksheet(inputs)) {
    return {
      kind: "fixture",
      headline: "ROI not calculated. Those values are the fixture worksheet.",
    };
  }

  const gross = Math.max(0, baselineHours - afterHours) * annualInvestigations * hourlyRate;
  const net = gross - annualCost;

  return {
    kind: "calculated",
    headline: "Entered inputs. Not a customer result.",
    gross,
    net,
    ratio: net / annualCost,
  };
}
