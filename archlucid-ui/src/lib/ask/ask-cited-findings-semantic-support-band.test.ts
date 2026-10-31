import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  ASK_CITED_FINDINGS_SEMANTIC_SUPPORT_NOT_SEALED_COPY,
  askCitedFindingBandIndexEntryFromOptionalBand,
  askCitedFindingBandIndexForFinding,
  buildAskCitedFindingBandIndex,
  formatAskCitedFindingsSemanticSupportBandFootnote,
  resolveAskCitedSemanticSupportBandForFindingIds,
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
  it("askCitedFindingBandIndexForFinding marks a stored band", () => {
    expect(askCitedFindingBandIndexForFinding("f-1", "Unsupported")).toEqual([
      { findingId: "f-1", band: "Unsupported", bandStored: true },
    ]);
  });

  it("askCitedFindingBandIndexForFinding does not invent a band when omitted", () => {
    expect(askCitedFindingBandIndexForFinding("f-1", undefined)).toEqual([
      { findingId: "f-1", band: null, bandStored: false },
    ]);
    expect(askCitedFindingBandIndexForFinding("f-1", null)).toEqual([
      { findingId: "f-1", band: null, bandStored: false },
    ]);
  });

  it("askCitedFindingBandIndexForFinding skips blank finding ids", () => {
    expect(askCitedFindingBandIndexForFinding("   ", "Supported")).toEqual([]);
  });

  it("omitted single-finding index uses not-stored footnote copy", () => {
    const footnote = formatAskCitedFindingsSemanticSupportBandFootnote(
      resolveAskCitedSemanticSupportBandForFindingIds({
        index: askCitedFindingBandIndexForFinding("f-1", undefined),
        referencedFindingIds: ["f-1"],
      }),
    );

    expect(footnote).toContain("Semantic support band was not stored");
    expect(footnote).not.toContain("NotScored");
  });

  it("buildAskCitedFindingBandIndex keeps decision-grade rows only", () => {
    const index = buildAskCitedFindingBandIndex([
      sampleFinding({ findingId: "dg-1", semanticSupportBand: "Supported" }),
      sampleFinding({
        findingId: "chk-1",
        classification: "ChecklistCoverage",
        semanticSupportBand: "Unsupported",
      }),
    ]);

    expect(index).toEqual([{ findingId: "dg-1", band: "Supported", bandStored: true }]);
  });

  it("askCitedFindingBandIndexEntryFromOptionalBand marks omitted band as not stored", () => {
    expect(askCitedFindingBandIndexEntryFromOptionalBand("f-1", null)).toEqual({
      findingId: "f-1",
      band: null,
      bandStored: false,
    });
    expect(askCitedFindingBandIndexEntryFromOptionalBand("f-1", undefined)).toEqual({
      findingId: "f-1",
      band: null,
      bandStored: false,
    });
  });

  it("askCitedFindingBandIndexEntryFromOptionalBand keeps a stored band", () => {
    expect(askCitedFindingBandIndexEntryFromOptionalBand("f-1", "Unsupported")).toEqual({
      findingId: "f-1",
      band: "Unsupported",
      bandStored: true,
    });
  });

  it("uses not-in-index copy when cited finding is missing from the loaded index", () => {
    const footnote = formatAskCitedFindingsSemanticSupportBandFootnote({
      weakestBand: null,
      hasMissingStoredBand: false,
      hasFindingNotInLoadedIndex: true,
    });

    expect(footnote).toContain("not in the loaded decision-grade findings");
    expect(footnote).not.toContain("Semantic support band was not stored");
  });

  it("uses omission copy when cited band was not stored", () => {
    const footnote = formatAskCitedFindingsSemanticSupportBandFootnote({
      weakestBand: null,
      hasMissingStoredBand: true,
      hasFindingNotInLoadedIndex: false,
    });

    expect(footnote).toContain("Semantic support band was not stored");
    expect(footnote).not.toContain("NotScored");
  });

  it("resolveWeakestAskCitedSemanticSupportBand prefers Unsupported", () => {
    expect(
      resolveWeakestAskCitedSemanticSupportBand(["Supported", "Unchecked", "Unsupported"]),
    ).toBe("Unsupported");
  });

  it("resolveWeakestAskCitedSemanticSupportBandForFindingIds matches ids case-insensitively", () => {
    const weakest = resolveWeakestAskCitedSemanticSupportBandForFindingIds({
      index: [
        { findingId: "f-1", band: "Supported", bandStored: true },
        { findingId: "F-2", band: "Unsupported", bandStored: true },
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
