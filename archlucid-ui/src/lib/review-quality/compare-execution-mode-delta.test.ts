import { describe, expect, it } from "vitest";

import { resolveCompareExecutionModeHonesty } from "@/lib/compare-execution-mode-honesty";
import { buildCompareExecutionModeDeltaView } from "@/lib/review-quality/compare-execution-mode-delta";
import type { RunSummary } from "@/types/authority";

function summary(mode: string): RunSummary {
  return {
    runId: `run-${mode}`,
    projectId: "p1",
    createdUtc: "2026-01-01T00:00:00Z",
    structuralExecutionMode: mode,
  } as RunSummary;
}

describe("buildCompareExecutionModeDeltaView", () => {
  it("returns null when honesty is missing", () => {
    expect(buildCompareExecutionModeDeltaView(null)).toBeNull();
  });

  it("labels Simulator vs Real and marks changed", () => {
    const honesty = resolveCompareExecutionModeHonesty(summary("Simulator"), summary("Real"));
    const view = buildCompareExecutionModeDeltaView(honesty);

    expect(view?.baseline.modeLabel).toBe("Simulator");
    expect(view?.target.modeLabel).toBe("Real");
    expect(view?.changed).toBe(true);
    expect(view?.advisoryParagraph).toContain("not be directly comparable");
  });
});
