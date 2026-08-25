import { describe, expect, it } from "vitest";

import {
  resolvePreferencesSaveEmphasizedStepId,
  resolvePreferencesSaveSteps,
} from "@/lib/preferences-save-checklist";

describe("preferences-save-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolvePreferencesSaveEmphasizedStepId({
        appearanceConfigured: false,
        localeScopeSaved: false,
        followUpPreferencesSaved: false,
      }),
    ).toBe("appearance");

    expect(
      resolvePreferencesSaveEmphasizedStepId({
        appearanceConfigured: true,
        localeScopeSaved: false,
        followUpPreferencesSaved: false,
      }),
    ).toBe("locale");
  });

  it("marks all steps complete when saved", () => {
    const steps = resolvePreferencesSaveSteps({
      appearanceConfigured: true,
      localeScopeSaved: true,
      followUpPreferencesSaved: true,
    });

    expect(steps.every((step) => step.complete)).toBe(true);
    expect(
      resolvePreferencesSaveEmphasizedStepId({
        appearanceConfigured: true,
        localeScopeSaved: true,
        followUpPreferencesSaved: true,
      }),
    ).toBe("follow-up");
  });
});
