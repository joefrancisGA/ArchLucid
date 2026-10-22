import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_EXPORT_DISPOSITION_HONESTY_HEADER,
  buildDecisionRegisterExportDocument,
  formatDecisionRegisterExportCsv,
  formatDecisionRegisterExportJson,
} from "@/lib/governance/decision-register-export";
import { FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION } from "@/lib/findings/finding-semantic-support-band-export";
import { FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

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

  it("uses omission copy only for missing confidence values and sources", () => {
    const missing = [
      {
        ...decisions[0],
        confidence: null,
        confidenceSource: " ",
        buyerConfidenceSource: null,
      },
    ];

    const json = formatDecisionRegisterExportJson(missing);
    const csv = formatDecisionRegisterExportCsv(missing);

    expect(json).toContain("Decision confidence was not stored.");
    expect(json).toContain("Confidence source was not stored.");
    expect(json).toContain("Buyer confidence source was not stored.");
    expect(csv).toContain("Decision confidence was not stored.");
    expect(csv).toContain("Confidence source was not stored.");
    expect(csv).toContain("Buyer confidence source was not stored.");
  });

  it("preserves stored zero and Unknown source values", () => {
    const stored = [
      {
        ...decisions[0],
        confidence: 0,
        confidenceSource: "Unknown",
        buyerConfidenceSource: "Evidence-backed",
      },
    ];

    const json = formatDecisionRegisterExportJson(stored);

    expect(json).toContain('"confidence": "0"');
    expect(json).toContain('"confidenceSource": "Unknown"');
    expect(json).toContain('"buyerConfidenceSource": "Evidence-backed"');
  });

  it("includes semantic support band stamp and supporting finding bands when context is provided (AS-071)", () => {
    const findings: QuickDecisionFinding[] = [
      {
        findingId: "finding-1",
        title: "Private endpoints",
        recommendation: "Adopt private endpoints.",
        severityValue: 2,
        findingOrder: 0,
        aiReasoning: { wireJson: "{}", reasoningTrace: "" },
        isMuted: false,
        muteReason: null,
        enforcementTier: "PolicyViolation",
        classification: FINDING_CLASSIFICATION_DECISION_GRADE,
        semanticSupportBand: "Supported",
      },
    ];
    const document = buildDecisionRegisterExportDocument(decisions, { findings });

    expect(document.semanticSupportBandStamp?.scorerVersion).toBe(
      FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
    );
    expect(document.semanticSupportBandStamp?.supported).toBe(1);
    expect(document.decisions[0]?.supportingFindingSemanticSupportBands).toEqual({
      "finding-1": "Supported",
    });
  });
});
