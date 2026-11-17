import { describe, expect, it } from "vitest";

import {
  formatGraphRagDiagnosticCount,
  formatGraphRagNeighborHitRate,
  formatGraphRagPilotFloorDisposition,
  graphRagMetricWasReturned,
  runGraphRagDiagnosticsStripHasSignal,
} from "@/lib/runs/run-graph-rag-diagnostics-display";

describe("run-graph-rag-diagnostics-display", () => {
  it("labels missing counts as not returned", () => {
    expect(formatGraphRagDiagnosticCount(undefined)).toBe("Not returned");
    expect(formatGraphRagPilotFloorDisposition(null)).toBe("Not returned");
  });

  it("normalizes neighbor hit rate", () => {
    expect(formatGraphRagNeighborHitRate(0.42)).toBe("42%");
    expect(formatGraphRagNeighborHitRate(42)).toBe("42%");
  });

  it("detects graph-RAG signal without fabricating zeros", () => {
    expect(
      runGraphRagDiagnosticsStripHasSignal({
        totalGraphRagNeighborsAdded: 0,
      } as never),
    ).toBe(true);
    expect(runGraphRagDiagnosticsStripHasSignal({} as never)).toBe(false);
    expect(
      runGraphRagDiagnosticsStripHasSignal({
        graphRagNeighborHitRate: "0.42",
      } as never),
    ).toBe(true);
  });

  it("treats a string neighbor hit rate as returned signal", () => {
    expect(
      runGraphRagDiagnosticsStripHasSignal({
        graphRagNeighborHitRate: "0.5",
      } as never),
    ).toBe(true);
  });

  it("treats OpenAPI double strings as returned graph-RAG metrics", () => {
    expect(graphRagMetricWasReturned("0")).toBe(true);
    expect(graphRagMetricWasReturned("0.42")).toBe(true);
    expect(graphRagMetricWasReturned("")).toBe(false);
    expect(
      runGraphRagDiagnosticsStripHasSignal({
        graphRagNeighborHitRate: "0.42",
      } as never),
    ).toBe(true);
  });
});
