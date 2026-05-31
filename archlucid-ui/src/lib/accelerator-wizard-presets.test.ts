import { describe, expect, it } from "vitest";

import {
  buildAcceleratorReviewStartHref,
  isAcceleratorPackId,
  resolveAcceleratorWizardPreset,
} from "@/lib/accelerator-wizard-presets";

describe("accelerator-wizard-presets", () => {
  it("builds baseline-first review links with accelerator query param", () => {
    expect(buildAcceleratorReviewStartHref("ai-llm-workload")).toBe(
      "/reviews/new?baseline=1&accelerator=ai-llm-workload",
    );
  });

  it("recognizes starter proof pack ids", () => {
    expect(isAcceleratorPackId("azure-cost-governance")).toBe(true);
    expect(isAcceleratorPackId("unknown-pack")).toBe(false);
  });

  it("returns wizard overrides for each pack", () => {
    const preset = resolveAcceleratorWizardPreset("healthcare-data-workflow");

    expect(preset).not.toBeNull();
    expect(preset?.systemName).toBe("Contoso.Clinical.DataHub");
    expect(preset?.policyReferences).toContain("starter:healthcare-data-workflow");
  });
});
