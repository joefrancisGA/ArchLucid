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

  it("does not count approved cannot-determine findings toward finalize blockers", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "q1",
          title: "Cannot determine recovery target",
          recommendation: "Insufficient evidence to verify RTO",
          severityValue: 2,
          humanReviewStatus: 2,
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

    expect(input.openCannotDetermineCount).toBe(0);
  });

  it("counts all unverified assumptions when existential assumptions are present", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "a1",
          title: "RTO assumption not documented",
          recommendation: "Recovery target is assumed without evidence",
        }),
        sampleFinding({
          findingId: "a2",
          title: "Assumption about logging retention",
          recommendation: "Logging retention period is assumed",
        }),
        sampleFinding({
          findingId: "a3",
          title: "Assumption about API auth model",
          recommendation: "Auth model is assumed from intake notes",
        }),
        sampleFinding({
          findingId: "a4",
          title: "Assumption about region failover",
          recommendation: "Failover region is assumed",
        }),
      ],
      0,
    );

    expect(input.unverifiedAssumptionCount).toBe(4);
  });

  it("does not count approved assumption findings toward finalize assumption totals", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "a1",
          title: "Assumption about cache",
          humanReviewStatus: 2,
        }),
        sampleFinding({
          findingId: "a2",
          title: "Assumption about API versioning",
          humanReviewStatus: 2,
        }),
        sampleFinding({
          findingId: "a3",
          title: "Assumption about auth",
          humanReviewStatus: 2,
        }),
      ],
      0,
    );

    expect(input.unverifiedAssumptionCount).toBe(0);
  });

  it("does not count approved low-confidence findings toward extraction fidelity blockers", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "f1",
          title: "Critical field extracted with low confidence",
          severityValue: 2,
          humanReviewStatus: 2,
          confidenceLevel: "Low",
        }),
      ],
      0,
    );

    expect(input.lowExtractionConfidenceCount).toBe(0);
  });

  it("counts titleless assumption findings toward finalize assumption totals", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "a1",
          title: "Assumption about cache",
          recommendation: "",
        }),
        sampleFinding({
          findingId: "a2",
          title: "Assumption about API versioning",
          recommendation: "",
        }),
        sampleFinding({
          findingId: "a3",
          title: "",
          recommendation: "Unverified assumption about encryption at rest",
        }),
      ],
      0,
    );

    expect(input.unverifiedAssumptionCount).toBe(3);
  });

  it("counts assumption findings when assumption language is only in reasoning trace", () => {
    const input = deriveFinalizeQualityScorecardInput(
      [
        sampleFinding({
          findingId: "a-trace",
          title: "",
          recommendation: "",
          aiReasoning: {
            reasoningTrace: "Unverified assumption about regional failover",
            wireJson: "{}",
          },
        }),
      ],
      0,
    );

    expect(input.unverifiedAssumptionCount).toBe(1);
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
