import { describe, expect, it } from "vitest";

import {
  formatGraphRagNeighborHitRateDisplay,
  resolveGraphRagPilotFloorLabel,
  shouldRenderGraphRagDiagnosticsStrip,
} from "@/lib/runs/run-graph-rag-diagnostics-display";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

describe("run-graph-rag-diagnostics-display", () => {
  it("renders when graph fields are present even if counts are zero", () => {
    const summary = {
      totalGraphRagNeighborsAdded: 0,
    } as RunRetrievalGroundingSummary;

    expect(shouldRenderGraphRagDiagnosticsStrip(summary)).toBe(true);
  });

  it("does not coerce missing hit rate to 0%", () => {
    expect(formatGraphRagNeighborHitRateDisplay({} as RunRetrievalGroundingSummary)).toBe("Not recorded");
  });

  it("does not default pilot floor to PASS", () => {
    expect(resolveGraphRagPilotFloorLabel(undefined)).toBe("Pilot floor not returned");
  });
});
