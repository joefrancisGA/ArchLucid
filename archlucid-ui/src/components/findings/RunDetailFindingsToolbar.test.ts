import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  deriveFindingsToolbarStatusCounts,
  deriveFindingsToolbarSeverityCounts,
  deriveOpenRootCauseClusterCount,
} from "./run-detail-findings-toolbar-presentation";

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
    aiReasoning: partial.aiReasoning ?? {
      reasoningTrace: "",
      wireJson: "{}",
    },
  };
}

describe("RunDetailFindingsToolbar helpers", () => {
  it("counts disposition-accepted findings as resolved", () => {
    const counts = deriveFindingsToolbarStatusCounts([
      sampleFinding({
        findingId: "f-open",
        humanReviewStatus: 1,
      }),
      sampleFinding({
        findingId: "f-accepted",
        humanReviewStatus: null,
        aiReasoning: {
          reasoningTrace: "",
          wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
        },
      }),
    ]);

    expect(counts).toEqual({ unresolved: 0, awaitingDecision: 1, resolved: 1 });
  });

  it("does not count disposition-closed findings in severity chips", () => {
    const counts = deriveFindingsToolbarSeverityCounts([
      sampleFinding({
        findingId: "f-critical-accepted",
        severityValue: 3,
        aiReasoning: {
          reasoningTrace: "",
          wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
        },
      }),
      sampleFinding({
        findingId: "f-high-open",
        severityValue: 2,
        humanReviewStatus: 1,
      }),
    ]);

    expect(counts).toEqual({ critical: 0, high: 1, medium: 0, low: 0 });
  });

  it("does not count root-cause clusters when all members are disposition-closed", () => {
    const dispositionClosedWire = {
      reasoningTrace: "",
      wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
    };

    const count = deriveOpenRootCauseClusterCount([
      sampleFinding({
        findingId: "f-a",
        policyRuleId: "cost.budget",
        aiReasoning: dispositionClosedWire,
      }),
      sampleFinding({
        findingId: "f-b",
        policyRuleId: "cost.budget",
        aiReasoning: dispositionClosedWire,
      }),
    ]);

    expect(count).toBe(0);
  });
});
