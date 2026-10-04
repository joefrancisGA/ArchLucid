import { describe, expect, it } from "vitest";

import { formatAgentExecutionConfidenceLabel } from "@/lib/reviews/agent-confidence-display";

describe("formatAgentExecutionConfidenceLabel", () => {
  it("returns Not recorded when confidence is absent", () => {
    expect(formatAgentExecutionConfidenceLabel({ resultId: "r1", agentType: "Critic" } as never)).toBe(
      "Not recorded",
    );
  });
});
