import { describe, expect, it } from "vitest";

import {
  buildFindingDerivationSentence,
  FINDING_DERIVATION_NOT_AVAILABLE,
  findingDerivationFromGovernanceQueueRow,
  findingDerivationFromQuickDecisionFinding,
} from "@/lib/findings/finding-derivation-sentence";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

function sampleQuickDecisionFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "finding-1",
    title: "Public ingress",
    recommendation: "Restrict ingress.",
    severityValue: 3,
    findingOrder: 0,
    aiReasoning: {
      wireJson: JSON.stringify({
        decisionRuleName: "Security baseline ingress rule",
        reasoningSummary: "Evidence shows public ingress on the intake API.",
      }),
      reasoningTrace: "",
    },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
    ...overrides,
  };
}

function sampleGovernanceRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Claims intake",
    manifestId: "manifest-1",
    findingId: "finding-1",
    title: "Public ingress",
    severity: "High",
    category: "sec-base-010",
    status: "Open",
    recommended: "Review ingress controls.",
    recordKind: "finding",
    evidenceRefCount: 2,
    ...overrides,
  };
}

describe("finding-derivation-sentence (TB-2154)", () => {
  it("prefers API reasoningSummary when present", () => {
    const result = buildFindingDerivationSentence({
      ruleName: "Ignored rule",
      reasoningSummary: "Evidence shows public ingress on the intake API.",
      severityLabel: "High",
      evidenceRefCount: 2,
    });

    expect(result.synthesised).toBe(false);
    expect(result.sentence).toBe("Evidence shows public ingress on the intake API.");
  });

  it("synthesizes rule, evidence, and severity when reasoning is absent", () => {
    const result = buildFindingDerivationSentence({
      ruleName: "PHI minimization at intake",
      severityLabel: "High",
      evidenceRefCount: 3,
    });

    expect(result.synthesised).toBe(true);
    expect(result.sentence).toContain('Policy rule "PHI minimization at intake"');
    expect(result.sentence).toContain("3 cited evidence references");
    expect(result.sentence).toContain("High severity finding");
  });

  it("returns honest unavailable copy when synthesis inputs are missing", () => {
    expect(buildFindingDerivationSentence({}).sentence).toBe(FINDING_DERIVATION_NOT_AVAILABLE);
  });

  it("derives from quick-decision finding wire JSON", () => {
    const result = findingDerivationFromQuickDecisionFinding(sampleQuickDecisionFinding());

    expect(result.sentence).toBe("Evidence shows public ingress on the intake API.");
  });

  it("derives from governance queue rows and skips decision rows", () => {
    const findingResult = findingDerivationFromGovernanceQueueRow(sampleGovernanceRow());

    expect(findingResult?.sentence).toContain("Security Architecture Baseline");
    expect(findingResult?.sentence).toContain("2 cited evidence references");

    expect(
      findingDerivationFromGovernanceQueueRow(sampleGovernanceRow({ recordKind: "decision" })),
    ).toBeNull();
  });
});
