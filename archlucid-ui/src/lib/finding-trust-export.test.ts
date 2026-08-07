import { describe, expect, it } from "vitest";

import { findingTrustExportJsonFields, formatFindingTrustExportLine } from "./finding-trust-export";

describe("formatFindingTrustExportLine", () => {
  it("returns null when no label", () => {
    expect(formatFindingTrustExportLine({})).toBeNull();
    expect(formatFindingTrustExportLine({ trustLabel: "  " })).toBeNull();
  });

  it("formats label with optional reason", () => {
    expect(formatFindingTrustExportLine({ trustLabel: "DeterministicRule" })).toBe("DeterministicRule");
    expect(
      formatFindingTrustExportLine({
        trustLabel: "DeterministicRule",
        trustLabelReason: "Rule fired.",
      }),
    ).toBe("DeterministicRule — Rule fired.");
  });
});

describe("findingTrustExportJsonFields", () => {
  it("omits fields when label absent", () => {
    expect(findingTrustExportJsonFields({})).toEqual({});
  });

  it("includes label and reason when present", () => {
    expect(
      findingTrustExportJsonFields({
        trustLabel: "ModelInference",
        trustLabelReason: "Agent output.",
      }),
    ).toEqual({ trustLabel: "ModelInference", trustLabelReason: "Agent output." });
  });
});
