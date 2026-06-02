import { describe, expect, it } from "vitest";

import { buildDefaultWizardValues } from "@/lib/wizard-schema";
import { wizardValuesToCreateRunPayload } from "@/lib/wizard-payload";

describe("wizard-payload", () => {
  it("includes wizard telemetry fields when options are provided", () => {
    const payload = wizardValuesToCreateRunPayload(buildDefaultWizardValues(), {
      requestSource: "wizard",
      wizardPresetUsed: "greenfield",
    });

    expect(payload.requestSource).toBe("wizard");
    expect(payload.wizardPresetUsed).toBe("greenfield");
  });

  it("omits wizard telemetry fields when options are absent", () => {
    const payload = wizardValuesToCreateRunPayload(buildDefaultWizardValues());

    expect(payload.requestSource).toBeUndefined();
    expect(payload.wizardPresetUsed).toBeUndefined();
  });
});
