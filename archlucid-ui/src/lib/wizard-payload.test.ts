import { describe, expect, it } from "vitest";

import { buildDefaultWizardValues } from "@/lib/wizard-schema";
import { deriveWizardPolicyPackCloudMismatch, wizardValuesToCreateRunPayload } from "@/lib/wizard-payload";

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

  it("omits model execution profile override when workspace default is selected", () => {
    const payload = wizardValuesToCreateRunPayload({
      ...buildDefaultWizardValues(),
      modelExecutionProfileOverride: "WorkspaceDefault",
    });

    expect(payload.modelExecutionProfileOverride).toBeUndefined();
  });

  it("maps per-review model alias override when set", () => {
    const payload = wizardValuesToCreateRunPayload({
      ...buildDefaultWizardValues(),
      modelAliasOverride: "premium-assurance",
    });

    expect(payload.modelAliasOverride).toBe("premium-assurance");
  });

  it("omits model alias override when workspace default is selected", () => {
    const payload = wizardValuesToCreateRunPayload({
      ...buildDefaultWizardValues(),
      modelAliasOverride: "",
    });

    expect(payload.modelAliasOverride).toBeUndefined();
  });

  it("flags Azure packs when wizard cloud target is AWS (TB-2322)", () => {
    const mismatch = deriveWizardPolicyPackCloudMismatch(
      {
        ...buildDefaultWizardValues(),
        cloudProvider: "Aws",
        policyReferences: ["cis-azure-baseline"],
      },
      { focusedPilotModeEnabled: false },
    );

    expect(mismatch).toContain("Azure-focused policy packs");
    expect(mismatch).toContain("AWS");
  });
});
