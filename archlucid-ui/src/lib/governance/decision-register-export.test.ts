import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER,
  formatDecisionRegisterExportCsv,
  formatDecisionRegisterExportJson,
} from "@/lib/governance/decision-register-export";

describe("decision-register-export (FC-79)", () => {
  const decisions = [
    {
      decisionId: "decision-1",
      manifestId: "00000000-0000-0000-0000-000000000101",
      runId: "00000000-0000-0000-0000-000000000001",
      category: "Security",
      title: "Use private endpoints",
      selectedOption: "Adopt private endpoints",
      rationale: "Reduce public exposure.",
      confidence: 0.9,
      confidenceSource: "Evidence-backed",
      buyerConfidenceSource: "Evidence-backed",
      recordedAtUtc: "2026-01-02T12:00:00.000Z",
      supportingFindingIds: ["finding-1"],
    },
  ] as const;

  it("includes disposition honesty in JSON export header", () => {
    const json = formatDecisionRegisterExportJson(decisions);

    expect(json).toContain(DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER);
    expect(json).toContain('"confidenceSource": "Evidence-backed"');
    expect(json).toContain('"buyerConfidenceSource": "Evidence-backed"');
  });

  it("includes disposition honesty and source columns in CSV export", () => {
    const csv = formatDecisionRegisterExportCsv(decisions);

    expect(csv).toContain(DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER);
    expect(csv).toContain("confidenceSource,buyerConfidenceSource");
    expect(csv).toContain("Evidence-backed,Evidence-backed");
  });
});
