import { describe, expect, it } from "vitest";

import {
  isSelectableWizardEvidenceSourceId,
  wizardEvidenceSourceTestId,
  WIZARD_EVIDENCE_SOURCE_OPTIONS,
} from "@/lib/wizard-evidence-source-options";

describe("wizard-evidence-source-options", () => {
  it("lists Tier-1 cloud inventory sources as accelerated and selectable", () => {
    const shippable = WIZARD_EVIDENCE_SOURCE_OPTIONS.filter((option) => option.availability !== "v1.1");
    const deferred = WIZARD_EVIDENCE_SOURCE_OPTIONS.filter((option) => option.availability === "v1.1");

    expect(shippable.some((option) => option.id === "azure-export")).toBe(true);
    expect(shippable.some((option) => option.id === "aws-inventory")).toBe(true);
    expect(shippable.some((option) => option.id === "gcp-inventory")).toBe(true);
    expect(deferred.length).toBeGreaterThanOrEqual(2);
    expect(isSelectableWizardEvidenceSourceId("gcp-inventory")).toBe(true);
    expect(isSelectableWizardEvidenceSourceId("aws-inventory")).toBe(true);
    expect(wizardEvidenceSourceTestId("aws-inventory")).toBe("wizard-evidence-source-aws-inventory");
  });
});
