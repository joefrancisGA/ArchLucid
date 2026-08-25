import { describe, expect, it } from "vitest";

import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { resolveNextFindingInReview } from "@/lib/findings/resolve-next-finding-in-review";

function baseFinding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "f1",
    title: "Title",
    recommendation: "Do the thing.",
    severityValue: 1,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "PolicyViolation",
    ...overrides,
  };
}

describe("resolveNextFindingInReview", () => {
  it("returns the next finding in triage sort order", () => {
    const next = resolveNextFindingInReview(
      [
        baseFinding({ findingId: "critical", title: "Critical gap", severityValue: 3, findingOrder: 1 }),
        baseFinding({ findingId: "medium", title: "Medium gap", severityValue: 2, findingOrder: 0 }),
      ],
      "critical",
    );

    expect(next?.findingId).toBe("medium");
  });

  it("returns null when the current finding is last in the queue", () => {
    const next = resolveNextFindingInReview(
      [baseFinding({ findingId: "only", title: "Only finding" })],
      "only",
    );

    expect(next).toBeNull();
  });
});
