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

  it("labels omitted integrity finding counts as not stored (P-15)", () => {
    expect(formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: undefined }))).toBe(
      "Analysis complete · Finding count was not stored.",
    );

    expect(
      listArchitectureIntelligenceRunTechnicalDetails(sampleResult({ integrityPassedFindingIds: undefined })).find(
        (row) => row.label === "Findings passed evidence checks",
      )?.value,
    ).toBe("Finding count was not stored.");
  });

  it("uses singular and zero finding phrasing", () => {
    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: ["f1"] })),
    ).toBe("Analysis complete · 1 evidence-backed finding");

    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: [] })),
    ).toBe("Analysis complete · No evidence-backed findings yet");
  });

  it("uses governed vocabulary when asserted trail is empty (FC-13)", () => {
    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult(), { assertedTrailEmpty: true }),
    ).toBe("Analysis complete · 3 governed findings");

    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: ["f1"] }), {
        assertedTrailEmpty: true,
      }),
    ).toBe("Analysis complete · 1 governed finding");

    expect(
      formatArchitectureIntelligenceRunHeadline(sampleResult({ integrityPassedFindingIds: [] }), {
        assertedTrailEmpty: true,
      }),
    ).toBe("Analysis complete · No governed findings yet");
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

  it("labels omitted structured element counts as not stored (P-06)", () => {
    expect(
      listArchitectureIntelligenceRunTechnicalDetails(sampleResult({ model: undefined })).find(
        (row) => row.label === "Structured details parsed",
      )?.value,
    ).toBe("Structured detail count was not stored.");
  });

  it("labels omitted AI budget facts when the run was not budget-rejected (P-04)", () => {
    const aiUsage = listArchitectureIntelligenceRunTechnicalDetails(
      sampleResult({ budgetRejected: false }),
    ).find((row) => row.label === "AI usage");

    expect(aiUsage?.value).toBe("AI budget facts were not stored on this run.");
  });

  it("describes fresh analysis runs in technical details", () => {
    const resultSource = listArchitectureIntelligenceRunTechnicalDetails(sampleResult()).find(
      (row) => row.label === "Result source",
    );

    expect(resultSource?.value).toBe("Fresh analysis run");
  });

  it("labels omitted cache reuse instead of a fresh run", () => {
    const resultSource = listArchitectureIntelligenceRunTechnicalDetails(
      sampleResult({ cacheHit: undefined }),
    ).find((row) => row.label === "Result source");

    expect(resultSource?.value).toBe("Analysis reuse was not stored.");
  });

  it("labels cache hits without a reuse reason as incomplete", () => {
    const resultSource = listArchitectureIntelligenceRunTechnicalDetails(
      sampleResult({ cacheHit: true, cacheReuseReason: null }),
    ).find((row) => row.label === "Result source");

    expect(resultSource?.value).toBe("Reused prior analysis. Reuse reason was not stored.");
  });
});
