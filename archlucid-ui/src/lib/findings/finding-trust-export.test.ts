import { describe, expect, it } from "vitest";

import { findingTrustExportJsonFields, formatFindingTrustExportLine } from "@/lib/findings/finding-trust-export";

describe("formatFindingTrustExportLine", () => {
  it("derives canonical label when wire trustLabel is absent", () => {
    expect(formatFindingTrustExportLine({ policyRuleId: "rule-1", evidenceRefCount: 0 })).toBe(
      "DeterministicRule",
    );
    expect(formatFindingTrustExportLine({ evidenceRefCount: 0 })).toBe("MissingCitation");
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
  it("derives json fields when wire label is absent", () => {
    expect(findingTrustExportJsonFields({ policyRuleId: "rule-1", evidenceRefCount: 0 })).toEqual({
      trustLabel: "DeterministicRule",
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
