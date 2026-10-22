import { describe, expect, it } from "vitest";

import {
  clampWizardStepIndex,
  isLastWizardStepIndex,
  nextWizardStepIndex,
  previousWizardStepIndex,
  UNKNOWN_WIZARD_STEP_LABEL,
  wizardStepHeadline,
  wizardStepLabelAt,
  type WizardStepDefinition,
} from "@/lib/wizard-step-sequence";

const STEPS: readonly WizardStepDefinition[] = [
  { label: "System & preset", description: "Name your system" },
  { label: "Architecture brief", description: "Goals and scope" },
  { label: "Review & submit", description: "Confirm defaults" },
];

describe("wizard-step-sequence", () => {
  it("clamps below zero and above the last index", () => {
    expect(clampWizardStepIndex(-4, 3)).toBe(0);
    expect(clampWizardStepIndex(9, 3)).toBe(2);
    expect(clampWizardStepIndex(1, 3)).toBe(1);
  });

  it("clamps to zero when there are no steps", () => {
    expect(clampWizardStepIndex(2, 0)).toBe(0);
  });

  it("never walks back past the first step", () => {
    expect(previousWizardStepIndex(0)).toBe(0);
    expect(previousWizardStepIndex(2)).toBe(1);
  });

  it("never walks forward past the last step", () => {
    expect(nextWizardStepIndex(2, 3)).toBe(2);
    expect(nextWizardStepIndex(0, 3)).toBe(1);
  });

  it("falls back to the unknown label outside the step list", () => {
    expect(wizardStepLabelAt(STEPS, 1)).toBe("Architecture brief");
    expect(wizardStepLabelAt(STEPS, 7)).toBe(UNKNOWN_WIZARD_STEP_LABEL);
  });

  it("identifies the last step", () => {
    expect(isLastWizardStepIndex(2, 3)).toBe(true);
    expect(isLastWizardStepIndex(1, 3)).toBe(false);
  });

  it("builds the one-based step headline", () => {
    expect(wizardStepHeadline("Quick start", 1, STEPS)).toBe(
      "Quick start — step 2 of 3: Architecture brief",
    );
  });
});
