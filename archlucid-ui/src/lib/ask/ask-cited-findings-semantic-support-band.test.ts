import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY,
  buildAskCitedFindingBandIndex,
  formatAskCitedFindingsSemanticSupportBandFootnote,
  resolveWeakestAskCitedSemanticSupportBand,
  resolveWeakestAskCitedSemanticSupportBandForFindingIds,
} from "@/lib/ask/ask-cited-findings-semantic-support-band";

function sampleFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "Ingress exposure",
    recommendation: "Tighten ingress",
    severityValue: 2,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "trace" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
    classification: "DecisionGradeFinding",
    semanticSupportBand: "Unchecked",
    ...overrides,
  };
}

describe("ask-cited-findings-semantic-support-band", () => {
  it("buildAskCitedFindingBandIndex keeps decision-grade rows only", () => {
    const index = buildAskCitedFindingBandIndex([
      sampleFinding({ findingId: "dg-1", semanticSupportBand: "Supported" }),
      sampleFinding({
        findingId: "chk-1",
        classification: "ChecklistCoverage",
        semanticSupportBand: "Unsupported",
      }),
    ]);

    expect(index).toEqual([{ findingId: "dg-1", band: "Supported" }]);
  });

  it("resolveWeakestAskCitedSemanticSupportBand prefers Unsupported", () => {
    expect(
      resolveWeakestAskCitedSemanticSupportBand(["Supported", "Unchecked", "Unsupported"]),
    ).toBe("Unsupported");
  });

  it("resolveWeakestAskCitedSemanticSupportBandForFindingIds matches ids case-insensitively", () => {
    const weakest = resolveWeakestAskCitedSemanticSupportBandForFindingIds({
      index: [
        { findingId: "f-1", band: "Supported" },
        { findingId: "F-2", band: "Unsupported" },
      ],
      referencedFindingIds: ["f-2", "f-1"],
    });

    expect(weakest).toBe("Unsupported");
  });

  it("formatAskCitedFindingsSemanticSupportBandFootnote includes TB-1003 honesty", () => {
    const footnote = formatAskCitedFindingsSemanticSupportBandFootnote("Unsupported");

    expect(footnote).toContain("Unsupported");
    expect(footnote).toContain(ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY);
  });
});
