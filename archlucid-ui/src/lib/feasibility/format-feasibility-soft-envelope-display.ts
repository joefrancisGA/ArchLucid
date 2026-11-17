export const FEASIBILITY_CONFIDENCE_BAND_NOT_STORED = "Confidence band was not stored." as const;

export function formatFeasibilityConfidenceBand(
  confidenceLow: number | null | undefined,
  confidenceHigh: number | null | undefined,
): string {
  const lowStored = typeof confidenceLow === "number" && Number.isFinite(confidenceLow);
  const highStored = typeof confidenceHigh === "number" && Number.isFinite(confidenceHigh);

  if (!lowStored && !highStored) {
    return FEASIBILITY_CONFIDENCE_BAND_NOT_STORED;
  }

  if (lowStored && !highStored) {
    return `${confidenceLow}–Confidence band high end was not stored.`;
  }

  if (!lowStored && highStored) {
    return `Confidence band low end was not stored.–${confidenceHigh}`;
  }

  return `${confidenceLow}–${confidenceHigh}`;
}

export function formatFeasibilityEnvelopeDescription(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Envelope description was not stored.";
  }

  if (value.trim().length === 0) {
    return "Envelope description was stored empty.";
  }

  return value;
}

export function formatFeasibilitySoftAssumption(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Soft assumption was not stored.";
  }

  if (value.trim().length === 0) {
    return "Soft assumption was stored empty.";
  }

  return value;
}

export function formatFeasibilityCostOfBeingWrong(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Cost of being wrong was not stored.";
  }

  if (value.trim().length === 0) {
    return "Cost of being wrong was stored empty.";
  }

  return value;
}
