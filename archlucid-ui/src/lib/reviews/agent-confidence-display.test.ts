import { describe, expect, it } from "vitest";

import { formatAgentExecutionConfidenceLabel } from "@/lib/reviews/agent-confidence-display";

describe("formatAgentExecutionConfidenceLabel", () => {
  it("returns Agent confidence was not stored when confidence is absent", () => {
    expect(formatAgentExecutionConfidenceLabel({ resultId: "r1", agentType: "Critic" } as never)).toBe(
      "Agent confidence was not stored.",
    );
  });

  it("shows calibrated and raw when both differ", () => {
    expect(
      formatAgentExecutionConfidenceLabel({
        resultId: "r1",
        agentType: "Critic",
        confidence: 0.4,
        calibratedConfidence: 0.72,
      } as never),
    ).toBe("Calibrated 72% (raw 40%)");
  });

  it("shows calibrated only when raw matches", () => {
    expect(
      formatAgentExecutionConfidenceLabel({
        resultId: "r1",
        agentType: "Critic",
        confidence: 0.5,
        calibratedConfidence: 0.5,
      } as never),
    ).toBe("Calibrated 50%");
  });
});
