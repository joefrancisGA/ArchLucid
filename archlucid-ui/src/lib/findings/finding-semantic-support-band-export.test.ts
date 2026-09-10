import { describe, expect, it } from "vitest";

import {
  buildSemanticSupportBandExportStamp,
  FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
  formatCareerExportSemanticSupportBandMarkdownSection,
  resolveFindingSemanticSupportBandExportFields,
  resolveSupportingFindingSemanticSupportBands,
} from "@/lib/findings/finding-semantic-support-band-export";
import { FINDING_CLASSIFICATION_CHECKLIST_COVERAGE, FINDING_CLASSIFICATION_DECISION_GRADE } from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function sampleFinding(
  overrides: Partial<QuickDecisionFinding> = {},
): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Gateway posture",
    recommendation: "Review gateway TLS.",
    severityValue: 3,
    findingOrder: 1,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    classification: FINDING_CLASSIFICATION_DECISION_GRADE,
    semanticSupportBand: "Unsupported",
    ...overrides,
  };
}

describe("finding-semantic-support-band-export (AS-071)", () => {
  it("resolveFindingSemanticSupportBandExportFields returns band and scorer version for decision-grade", () => {
    expect(resolveFindingSemanticSupportBandExportFields(sampleFinding())).toEqual({
      semanticSupportBand: "Unsupported",
      semanticSupportBandScorerVersion: FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION,
    });
  });

  it("resolveFindingSemanticSupportBandExportFields omits checklist coverage", () => {
    expect(
      resolveFindingSemanticSupportBandExportFields(
        sampleFinding({ classification: FINDING_CLASSIFICATION_CHECKLIST_COVERAGE }),
      ),
    ).toBeNull();
  });

  it("buildSemanticSupportBandExportStamp matches stamp counts", () => {
    const stamp = buildSemanticSupportBandExportStamp([
      sampleFinding({ semanticSupportBand: "Supported" }),
      sampleFinding({ findingId: "f-2", semanticSupportBand: "Unchecked" }),
      sampleFinding({ findingId: "f-3", semanticSupportBand: "Unsupported" }),
    ]);

    expect(stamp.scorerVersion).toBe(FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION);
    expect(stamp.counts.supported).toBe(1);
    expect(stamp.counts.unchecked).toBe(1);
    expect(stamp.counts.unsupported).toBe(1);
    expect(stamp.stampLine).toContain("1 Supported");
    expect(stamp.stampLine).toContain("1 Unsupported");
  });

  it("formatCareerExportSemanticSupportBandMarkdownSection includes scorer version", () => {
    const markdown = formatCareerExportSemanticSupportBandMarkdownSection([
      sampleFinding({ semanticSupportBand: "Supported" }),
    ]);

    expect(markdown).toContain("## Semantic support");
    expect(markdown).toContain(FINDING_SEMANTIC_SUPPORT_BAND_SCORER_VERSION);
    expect(markdown).toContain("Supported");
  });

  it("resolveSupportingFindingSemanticSupportBands maps supporting finding ids", () => {
    const findings = [
      sampleFinding({ findingId: "f-1", semanticSupportBand: "Unsupported" }),
      sampleFinding({ findingId: "f-2", semanticSupportBand: "Supported" }),
    ];

    expect(resolveSupportingFindingSemanticSupportBands(["f-2", "missing"], findings)).toEqual({
      "f-2": "Supported",
    });
  });
});
