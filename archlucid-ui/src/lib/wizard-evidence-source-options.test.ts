import { describe, expect, it } from "vitest";

import {
  isSelectableWizardEvidenceSourceId,
  wizardEvidenceSourceTestId,
  WIZARD_EVIDENCE_SOURCE_OPTIONS,
} from "@/lib/wizard-evidence-source-options";

describe("wizard-evidence-source-options", () => {
  it("lists at least four shippable sources plus honest V1.1 placeholders", () => {
    const shippable = WIZARD_EVIDENCE_SOURCE_OPTIONS.filter((option) => option.availability !== "v1.1");
    const deferred = WIZARD_EVIDENCE_SOURCE_OPTIONS.filter((option) => option.availability === "v1.1");

    expect(shippable.length).toBeGreaterThanOrEqual(4);
    expect(deferred.length).toBeGreaterThanOrEqual(3);
    expect(shippable.some((option) => option.id === "azure-export" && option.availability === "accelerated")).toBe(true);
  });

  it("marks deferred inventory and model-import sources as non-selectable", () => {
    expect(isSelectableWizardEvidenceSourceId("aws-gcp-inventory")).toBe(false);
    expect(isSelectableWizardEvidenceSourceId("documents")).toBe(true);
    expect(wizardEvidenceSourceTestId("azure-export")).toBe("wizard-evidence-source-azure-export");
  });
});
