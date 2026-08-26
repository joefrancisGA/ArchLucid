import { describe, expect, it } from "vitest";

import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import {
  formatArchitectureIntelligenceRunHeadline,
  listArchitectureIntelligenceRunTechnicalDetails,
} from "@/lib/architecture/architecture-intelligence-run-summary-copy";

function sampleResult(overrides: Partial<ClosedLoopReasoningResult> = {}): ClosedLoopReasoningResult {
  return {
    model: { elements: [{}, {}, {}] },
    integrityPassedFindingIds: ["f1", "f2", "f3"],
    cacheHit: false,
    ...overrides,
  };
}

describe("architecture-intelligence-run-summary-copy", () => {
  it("formats a human-readable headline with evidence-backed finding count", () => {
    expect(formatArchitectureIntelligenceRunHeadline(sampleResult())).toBe(
      "Analysis complete · 3 evidence-backed findings",
    );
  });

  it("uses singular and zero finding phrasing", () => {
    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: ["f1"] })),
    ).toBe("Analysis complete · 1 evidence-backed finding");

    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: [] })),
    ).toBe("Analysis complete · No evidence-backed findings yet");
  });

  it("lists operator diagnostics without jargon in labels", () => {
    expect(
      listArchitectureIntelligenceRunTechnicalDetails(
        sampleResult({
          cacheHit: true,
          cacheReuseReason: "dependency manifest unchanged",
          runId: "run-123",
          budgetEstimatedCostUsd: 0.42,
          budgetRemainingUsd: 12,
        }),
      ),
    ).toEqual([
      { label: "Structured details parsed", value: "3" },
      { label: "Findings passed evidence checks", value: "3" },
      {
        label: "Result source",
        value: "Reused prior analysis (dependency manifest unchanged)",
      },
      { label: "AI usage", value: "Estimated cost $0.42 · $12.00 AI budget remaining" },
      { label: "Run id", value: "run-123" },
    ]);
  });

  it("describes fresh analysis runs in technical details", () => {
    const resultSource = listArchitectureIntelligenceRunTechnicalDetails(sampleResult()).find(
      (row) => row.label === "Result source",
    );

    expect(resultSource?.value).toBe("Fresh analysis run");
  });
});
