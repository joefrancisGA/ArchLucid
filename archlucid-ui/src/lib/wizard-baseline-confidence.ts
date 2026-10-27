/** Confidence labels for review-cycle baseline capture in the architecture wizard (TB-238). */
export type WizardBaselineConfidence = "measured" | "team_estimate" | "unsure";

export const WIZARD_BASELINE_CONFIDENCE_OPTIONS: ReadonlyArray<{
  value: WizardBaselineConfidence;
  label: string;
}> = [
  { value: "measured", label: "Very confident (measured)" },
  { value: "team_estimate", label: "Somewhat confident (team estimate)" },
  { value: "unsure", label: "Not sure (leave blank)" },
];

export function wizardBaselineConfidenceSourceNote(confidence: WizardBaselineConfidence): string {
  if (confidence === "unsure") {
    return "Confidence was not chosen.";
  }

  const match = WIZARD_BASELINE_CONFIDENCE_OPTIONS.find((option) => option.value === confidence);

  if (match === undefined) {
    return "Confidence was not chosen.";
  }

  return `wizard: ${match.label}`;
}
