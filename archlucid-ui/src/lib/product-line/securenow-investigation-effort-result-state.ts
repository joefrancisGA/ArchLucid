import {
  isSecureNowInvestigationEffortFixtureWorksheet,
  type SecureNowInvestigationEffortInputFields,
} from "@/lib/product-line/securenow-investigation-effort-input-storage";
import {
  formatSecureNowInvestigationEffortMissingFieldsReason,
  listSecureNowInvestigationEffortMissingFieldLabels,
  parseSecureNowInvestigationEffortNonNegative,
  parseSecureNowInvestigationEffortPositive,
} from "@/lib/product-line/securenow-investigation-effort-missing-fields";

export type SecureNowInvestigationEffortIncompleteReason =
  | "missing_fields"
  | "invalid_after_hours";

export type SecureNowInvestigationEffortResultState =
  | {
      readonly kind: "incomplete";
      readonly headline: "ROI not calculated.";
      readonly reason: string;
      readonly incompleteReason: SecureNowInvestigationEffortIncompleteReason;
    }
  | { readonly kind: "fixture"; readonly headline: "ROI not calculated. Those values are the fixture worksheet." }
  | {
      readonly kind: "calculated";
      readonly headline: "Entered inputs. Not a customer result.";
      readonly gross: number;
      readonly net: number;
      readonly ratio: number;
    };

export function resolveSecureNowInvestigationEffortResultState(
  inputs: SecureNowInvestigationEffortInputFields,
): SecureNowInvestigationEffortResultState {
  const baselineHours = parseSecureNowInvestigationEffortNonNegative(inputs.baselineHours);
  const afterHours = parseSecureNowInvestigationEffortNonNegative(inputs.afterHours);
  const annualInvestigations = parseSecureNowInvestigationEffortPositive(inputs.annualInvestigations);
  const hourlyRate = parseSecureNowInvestigationEffortPositive(inputs.hourlyRate);
  const annualCost = parseSecureNowInvestigationEffortPositive(inputs.annualCost);

  if (
    baselineHours === null
    || afterHours === null
    || annualInvestigations === null
    || hourlyRate === null
    || annualCost === null
  ) {
    const missingLabels = listSecureNowInvestigationEffortMissingFieldLabels(inputs);

    return {
      kind: "incomplete",
      headline: "ROI not calculated.",
      reason: formatSecureNowInvestigationEffortMissingFieldsReason(missingLabels),
      incompleteReason: "missing_fields",
    };
  }

  if (afterHours > baselineHours) {
    return {
      kind: "incomplete",
      headline: "ROI not calculated.",
      reason: "After-product hours must not exceed baseline hours for a positive capacity delta.",
      incompleteReason: "invalid_after_hours",
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
