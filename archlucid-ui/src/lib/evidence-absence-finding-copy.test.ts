import { describe, expect, it } from "vitest";

import { evidenceAbsenceFindingLabel, isEvidenceAbsenceFindingTitle } from "./evidence-absence-finding-copy";

describe("isEvidenceAbsenceFindingTitle", () => {
  it("detects the topology-absence finding regardless of casing", () => {
    expect(isEvidenceAbsenceFindingTitle("No topology resources were found")).toBe(true);
    expect(isEvidenceAbsenceFindingTitle("no TOPOLOGY resources were found")).toBe(true);
  });

  it("treats a normal defect finding as not an absence finding", () => {
    expect(isEvidenceAbsenceFindingTitle("Encrypt PHI stores")).toBe(false);
  });

  it("treats blank and nullish titles as not absence findings", () => {
    expect(isEvidenceAbsenceFindingTitle("   ")).toBe(false);
    expect(isEvidenceAbsenceFindingTitle(null)).toBe(false);
    expect(isEvidenceAbsenceFindingTitle(undefined)).toBe(false);
  });
});

describe("evidenceAbsenceFindingLabel", () => {
  it("restates the absence finding as what the evidence did", () => {
    expect(evidenceAbsenceFindingLabel("No topology resources were found")).toBe(
      "Evidence did not surface architecture components",
    );
  });

  it("returns non-absence titles unchanged", () => {
    expect(evidenceAbsenceFindingLabel("Encrypt PHI stores")).toBe("Encrypt PHI stores");
  });
});
