import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import { countFindingsAwaitingAction, countOpenFindings } from "./finding-metrics";

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

describe("finding-metrics", () => {
  it("does not count disposition-accepted findings as open", () => {
    const openCount = countOpenFindings([
      sampleFinding({
        findingId: "f-open",
        title: "Still needs a decision",
        humanReviewStatus: 1,
      }),
      sampleFinding({
        findingId: "f-accepted",
        title: "Accepted regional failover decision",
        humanReviewStatus: null,
        aiReasoning: {
          reasoningTrace: "",
          wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
        },
      }),
    ]);

    expect(openCount).toBe(1);
  });

  it("does not count disposition-accepted high-severity findings as awaiting action", () => {
    const awaitingActionCount = countFindingsAwaitingAction([
      sampleFinding({
        findingId: "f-accepted-high",
        severityValue: 2,
        humanReviewStatus: null,
        aiReasoning: {
          reasoningTrace: "",
          wireJson: JSON.stringify({ latestDisposition: "Accepted" }),
        },
      }),
    ]);

    expect(awaitingActionCount).toBe(0);
  });
});
