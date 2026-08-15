import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { deriveFindingsToolbarStatusCounts } from "./RunDetailFindingsToolbar";

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
});
