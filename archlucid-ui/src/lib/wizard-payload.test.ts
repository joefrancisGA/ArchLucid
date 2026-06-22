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

  it("maps None cloudProvider for evidence-only intake (TB-340)", () => {
    const payload = wizardValuesToCreateRunPayload({
      ...buildDefaultWizardValues(),
      cloudProvider: "None",
      documents: [{ name: "brief.md", contentType: "text/markdown", content: "Pre-deployment architecture brief." }],
    });

    expect(payload.cloudProvider).toBe("None");
  });

  it("includes focused pilot policy reference by default", () => {
    const payload = wizardValuesToCreateRunPayload(buildDefaultWizardValues(), { requestSource: "wizard" });

    expect(payload.policyReferences).toContain("pilot-mode:security-baseline-cost-only");
  });

  it("omits focused pilot policy reference when disabled", () => {
    const payload = wizardValuesToCreateRunPayload(buildDefaultWizardValues(), {
      requestSource: "wizard",
      focusedPilotModeEnabled: false,
    });

    expect(payload.policyReferences ?? []).not.toContain("pilot-mode:security-baseline-cost-only");
  });
});
