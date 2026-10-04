import { describe, expect, it } from "vitest";

import { formatRunAgentForensicsEvaluationFooter } from "@/lib/runs/run-agent-forensics-evaluation-footer";

describe("formatRunAgentForensicsEvaluationFooter", () => {
  it("orders scored vs skipped before averages", () => {
    const text = formatRunAgentForensicsEvaluationFooter({
      evaluatedAtLabel: "Jan 1, 2026",
      perspective: {
        authority: "advisoryCurrent",
        scores: [{ traceId: "t1" } as never],
        tracesSkippedCount: 2,
        averageStructuralCompletenessRatio: 0.8,
        averageSemanticScore: 0.6,
      },
    });

    expect(text.indexOf("Scored 1 trace")).toBeLessThan(text.indexOf("Skipped 2"));
    expect(text).toContain("Averages below are over scored traces only");
  });
});
