import { describe, expect, it } from "vitest";

import { resolveFeasibilityVerdictForDisplay } from "@/lib/feasibility/resolve-feasibility-verdict-for-display";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

describe("livelihood-grade-no uncited hard UI (LN-031)", () => {
  it("does not label uncited hard as Career-hard on Working surfaces", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "HardInfeasible",
      summary: "Cannot satisfy latency and consistency together.",
      confidence: 100,
      hardCitations: [],
      unsatCoreInvariantKeys: [],
      transparencyTrail: { asserted: [], inferred: [], skipped: [] },
    };

    const resolution = resolveFeasibilityVerdictForDisplay(verdict);

    expect(resolution.missingHardCitationDefect).toBe(true);
    expect(resolution.kindLabel).toBe("Infeasibility verdict needs citation");
    expect(resolution.tone).toBe("warning");
  });
});
