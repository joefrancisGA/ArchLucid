import { describe, expect, it } from "vitest";

import { guidedIntakeWizardHasUnsavedEdits } from "./guided-intake-wizard-unsaved";

describe("guidedIntakeWizardHasUnsavedEdits (LW-075)", () => {
  const emptyInput = {
    freeTextIntent: "",
    businessOutcome: "",
    systemName: "",
    answers: {},
    draftId: null,
    step: 0,
    isSubmitBlocked: false,
  };

  it("returns false for an empty new wizard", () => {
    expect(guidedIntakeWizardHasUnsavedEdits(emptyInput)).toBe(false);
  });

  it("returns false when the draft is already submitted", () => {
    expect(
      guidedIntakeWizardHasUnsavedEdits({
        ...emptyInput,
        freeTextIntent: "Intent text",
        isSubmitBlocked: true,
      }),
    ).toBe(false);
  });

  it("returns true when the operator typed a brief field", () => {
    expect(
      guidedIntakeWizardHasUnsavedEdits({
        ...emptyInput,
        freeTextIntent: "  Architecture overview  ",
      }),
    ).toBe(true);
  });

  it("returns true after advancing past the scope step", () => {
    expect(
      guidedIntakeWizardHasUnsavedEdits({
        ...emptyInput,
        step: 1,
      }),
    ).toBe(true);
  });
});
