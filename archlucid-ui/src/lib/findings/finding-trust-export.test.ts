import { describe, expect, it } from "vitest";

import { findingTrustExportJsonFields, formatFindingTrustExportLine } from "./finding-trust-export";

describe("formatFindingTrustExportLine", () => {
  it("preserves missing wire labels in export lines", () => {
    expect(formatFindingTrustExportLine({ policyRuleId: "rule-1", evidenceRefCount: 0 })).toBe(
      "Trust label was not stored.",
    );
    expect(formatFindingTrustExportLine({ evidenceRefCount: 0 })).toBe("Trust label was not stored.");
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
  it("preserves missing wire labels in json fields", () => {
    expect(findingTrustExportJsonFields({ policyRuleId: "rule-1", evidenceRefCount: 0 })).toEqual({
      trustLabel: "Trust label was not stored.",
    });
  });

  it("includes label and reason when present", () => {
    expect(
      findingTrustExportJsonFields({
        trustLabel: "EvidenceBacked",
        trustLabelReason: "Agent output.",
      }),
    ).toEqual({ trustLabel: "EvidenceBacked", trustLabelReason: "Agent output." });
  });
});
