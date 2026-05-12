import { describe, expect, it } from "vitest";

import {
  buildAdrExplanationSlice,
  buildAdrGeneratorRunInput,
  buildMadrMarkdownFromRun,
  type AdrGeneratorRunInput,
} from "@/lib/adr-from-run";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";
import type { RunExplanationSummary } from "@/types/explanation";

describe("adr-from-run", () => {
  it("buildMadrMarkdownFromRun includes MADR-style sections and run metadata", () => {
    const input: AdrGeneratorRunInput = {
      runId: "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501",
      projectId: "p1",
      reviewTitle: "Spike: data residency",
      createdUtc: "2026-05-01T12:00:00.000Z",
      manifestStatusLabel: "Committed",
      policyPackLabel: "Core Pilot v1",
      manifestCounts: { decisions: 3, warnings: 1, unresolvedIssues: 0 },
      explanation: {
        overallAssessment: "Overall solid with one gap.",
        riskPosture: "Medium",
        themeSummaries: ["Residency", "Encryption"],
        summary: "Short summary.",
        keyDrivers: ["Driver A"],
        riskImplications: ["Latency risk"],
        costImplications: ["Extra regions"],
        complianceImplications: ["DPA alignment"],
        detailedNarrative: "Long narrative.",
        structuredReasoning: "Stepwise reasoning.",
        alternativesConsidered: ["Alt 1"],
        caveats: ["Check legal"],
        provenanceLine: "ArchitectAgent · gpt-test",
        faithfulnessWarning: null,
        deterministicFallbackUsed: false,
      },
      findings: [
        {
          findingId: "f1",
          title: "Store PII in-region",
          recommendation: "Encrypt and pin region.",
          severityLabel: "High",
          aiReasoningExcerpt: "Model cited graph path.",
        },
      ],
    };

    const md = buildMadrMarkdownFromRun(input);

    expect(md).toContain("# ADR: Spike: data residency");
    expect(md).toContain("## Status");
    expect(md).toContain("accepted");
    expect(md).toContain("## Context");
    expect(md).toContain("## Decision");
    expect(md).toContain("## Consequences");
    expect(md).toContain(input.runId);
    expect(md).toContain("[High] Store PII in-region");
    expect(md).toContain("Driver A");
  });

  it("buildAdrExplanationSlice returns null for null summary", () => {
    expect(buildAdrExplanationSlice(null)).toBeNull();
  });

  it("buildAdrGeneratorRunInput sorts and caps findings", () => {
    const low: QuickDecisionFinding = {
      findingId: "low",
      title: "Low",
      recommendation: "r",
      severityValue: 0,
      findingOrder: 0,
      aiReasoning: { wireJson: "{}", reasoningTrace: "a" },
      isMuted: false,
      muteReason: null,
    };

    const high: QuickDecisionFinding = {
      findingId: "high",
      title: "High",
      recommendation: "r",
      severityValue: 3,
      findingOrder: 1,
      aiReasoning: { wireJson: "{}", reasoningTrace: "b" },
      isMuted: false,
      muteReason: null,
    };

    const muted: QuickDecisionFinding = {
      findingId: "muted",
      title: "Muted",
      recommendation: "r",
      severityValue: 3,
      findingOrder: 2,
      aiReasoning: { wireJson: "{}", reasoningTrace: "c" },
      isMuted: true,
      muteReason: "noise",
    };

    const input = buildAdrGeneratorRunInput({
      runId: "r1",
      projectId: "p1",
      reviewTitle: "T",
      createdUtc: "2026-01-01T00:00:00.000Z",
      manifestStatusLabel: null,
      policyPackLabel: null,
      manifestCounts: null,
      explanationSummary: null,
      quickDecisionFindings: [low, high, muted],
      maxFindings: 5,
      severityLabelForFinding: severityBadgeLabel,
    });

    expect(input.findings.length).toBe(2);
    expect(input.findings[0]?.findingId).toBe("high");
    expect(input.findings[1]?.findingId).toBe("low");
  });

  it("buildAdrExplanationSlice maps provenance and faithfulness flags", () => {
    const summary: RunExplanationSummary = {
      explanation: {
        rawText: "",
        structured: null,
        confidence: null,
        provenance: {
          agentType: "X",
          modelId: "Y",
          promptTemplateId: null,
          promptTemplateVersion: null,
          promptContentHash: null,
        },
        summary: "",
        keyDrivers: [],
        riskImplications: [],
        costImplications: [],
        complianceImplications: [],
        detailedNarrative: "",
      },
      themeSummaries: [],
      overallAssessment: "",
      riskPosture: "",
      findingCount: 0,
      decisionCount: 0,
      unresolvedIssueCount: 0,
      complianceGapCount: 0,
      faithfulnessWarning: "warn",
      usedDeterministicFallback: true,
    };

    const slice = buildAdrExplanationSlice(summary);

    expect(slice?.provenanceLine).toBe("X · Y");
    expect(slice?.deterministicFallbackUsed).toBe(true);
    expect(slice?.faithfulnessWarning).toBe("warn");
  });
});
