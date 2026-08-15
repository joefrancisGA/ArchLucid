import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  deriveApprovedDecisionTitlesFromFindings,
  deriveFinalizeQualityScorecardInput,
} from "./finalize-quality-scorecard-from-findings";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Sample finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    humanReviewStatus: partial.humanReviewStatus ?? null,
    trustLabel: partial.trustLabel ?? null,
    policyRuleId: partial.policyRuleId ?? null,
    evidenceRefCount: partial.evidenceRefCount ?? 0,
    confidenceLevel: partial.confidenceLevel ?? null,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("finalize-quality-scorecard-from-findings", () => {
  it("counts open cannot-determine and coverage-gap job views", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "q1",
          title: "Cannot determine recovery target",
          recommendation: "Insufficient evidence to verify RTO",
          severityValue: 2,
          trustLabel: "Heuristic",
          evidenceRefCount: 0,
          aiReasoning: {
            reasoningTrace: "cannot determine failover path",
            wireJson: "{}",
          },
        }),
        sampleFinding({
          findingId: "c1",
          title: "Uncovered requirement",
          recommendation: "No design decision for mandatory logging",
          policyRuleId: "requirement-coverage",
        }),
      ],
      0,
    );

    expect(input.openCannotDetermineCount).toBe(1);
    expect(input.uncoveredMandatoryRequirementCount).toBe(1);
  });

  it("does not count cannot-determine findings as uncovered mandatory requirements", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "q1",
          title: "Cannot determine recovery target",
          recommendation: "Insufficient evidence to verify RTO",
          severityValue: 2,
          trustLabel: "Heuristic",
          evidenceRefCount: 0,
          aiReasoning: {
            reasoningTrace: "cannot determine failover path",
            wireJson: "{}",
          },
        }),
      ],
      0,
    );

    expect(input.openCannotDetermineCount).toBe(1);
    expect(input.uncoveredMandatoryRequirementCount).toBe(0);
  });

  it("derives approved decision titles from approved human review rows", () => {
    const titles = deriveApprovedDecisionTitlesFromFindings([
      sampleFinding({
        findingId: "d1",
        title: "Approved API gateway decision",
        humanReviewStatus: 2,
      }),
    ]);

    expect(titles).toEqual(["Approved API gateway decision"]);
  });
});
