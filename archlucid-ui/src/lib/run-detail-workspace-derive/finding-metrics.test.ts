import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

import {
  countFindingsAwaitingAction,
  countFindingsBySeverity,
  countOpenFindings,
} from "./finding-metrics";

function sampleFinding(
  partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">,
): QuickDecisionFinding {
  return {
    findingId: partial.findingId,
    title: partial.title ?? "Sample finding",
    recommendation: partial.recommendation ?? "",
    severityValue: partial.severityValue === undefined ? 1 : partial.severityValue,
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

  it("does not include findings with missing severity in numeric severity counts", () => {
    expect(
      countFindingsBySeverity([
        sampleFinding({ findingId: "f-unknown", severityValue: null }),
        sampleFinding({ findingId: "f-low", severityValue: 0 }),
      ]),
    ).toEqual({ critical: 0, high: 0, medium: 0, low: 1 });
  });
});
