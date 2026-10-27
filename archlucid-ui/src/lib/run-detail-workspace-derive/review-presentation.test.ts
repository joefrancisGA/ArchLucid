import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  deriveOverallPostureLabel,
  deriveReviewHeaderPresentation,
  deriveReviewNextActionLabel,
} from "./review-presentation";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Open finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue ?? 1,
    findingOrder: partial.findingOrder ?? 0,
    isMuted: partial.isMuted ?? false,
    muteReason: partial.muteReason ?? null,
    enforcementTier: partial.enforcementTier ?? "Blocking",
    humanReviewStatus: partial.humanReviewStatus ?? null,
    evidenceRefCount: partial.evidenceRefCount !== undefined ? partial.evidenceRefCount : 0,
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("deriveOverallPostureLabel (P-11)", () => {
  it("does not substitute highest severity when risk posture is missing", () => {
    expect(deriveOverallPostureLabel(null, null, "Critical")).toBe("Risk posture was not stored.");
  });
});

describe("deriveReviewHeaderPresentation (P-19)", () => {
  it("uses not-stored H1 for finalized template reviews without a usable title", () => {
    const header = deriveReviewHeaderPresentation({
      reviewTitle: "",
      systemName: null,
      runId: "run-1",
      templateLabel: "Security baseline",
      manifestId: "manifest-1",
    });

    expect(header.h1Title).toBe("Review title was not stored.");
    expect(header.eyebrowLabel).toContain("Review template:");
  });
});

describe("deriveReviewNextActionLabel (P-20)", () => {
  it("does not claim missing evidence when unresolved finding has stored refs", () => {
    const label = deriveReviewNextActionLabel({
      recommendedActions: [],
      primaryConcernFinding: sampleFinding({
        findingId: "f-1",
        title: "Public ingress",
        evidenceRefCount: 2,
        humanReviewStatus: 1,
        severityValue: 3,
      }),
      blockingFindingCount: 0,
      hasFindingsSnapshot: true,
    });

    expect(label).not.toContain("Confirm evidence");
    expect(label).not.toContain("Evidence reference count was not stored");
  });

  it("uses not-stored copy when primary finding omits evidenceRefCount", () => {
    const label = deriveReviewNextActionLabel({
      recommendedActions: [],
      primaryConcernFinding: sampleFinding({
        findingId: "f-1",
        title: "Public ingress",
        evidenceRefCount: null,
        humanReviewStatus: 1,
      }),
      blockingFindingCount: 0,
      hasFindingsSnapshot: true,
    });

    expect(label).toContain("Evidence reference count was not stored");
    expect(label).toContain("Public ingress");
  });

  it("uses not-stored copy for next action when findings snapshot is absent", () => {
    const label = deriveReviewNextActionLabel({
      recommendedActions: [],
      primaryConcernFinding: null,
      blockingFindingCount: 0,
      hasFindingsSnapshot: false,
    });

    expect(label).toBe("Next action was not stored.");
  });

  it("does not claim no actions are required when findings snapshot flag is omitted", () => {
    const label = deriveReviewNextActionLabel({
      recommendedActions: [],
      primaryConcernFinding: null,
      blockingFindingCount: 0,
    });

    expect(label).toBe("Findings snapshot was not stored, so no next action is recorded.");
  });
});

describe("deriveEvidenceCoverageSummary", () => {
  it("uses not-stored copy when snapshot is absent and there are no open findings", async () => {
    const { deriveEvidenceCoverageSummary } = await import("./review-presentation");

    const summary = deriveEvidenceCoverageSummary([], { hasFindingsSnapshot: false });

    expect(summary.summaryLine).toBe("Evidence coverage was not stored.");
  });
});
