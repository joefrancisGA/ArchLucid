import { describe, expect, it } from "vitest";

import {
  formatGraphRagDiagnosticCount,
  formatGraphRagNeighborHitRate,
  formatGraphRagPilotFloorDisposition,
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
  });
});
