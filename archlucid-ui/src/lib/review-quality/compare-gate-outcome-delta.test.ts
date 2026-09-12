import { describe, expect, it } from "vitest";

import { buildCompareGateOutcomeDeltaView } from "@/lib/review-quality/compare-gate-outcome-delta";

describe("buildCompareGateOutcomeDeltaView", () => {
  it("returns null when both sides lack a gate kind", () => {
    expect(
      buildCompareGateOutcomeDeltaView({
        baselineKind: null,
        targetKind: null,
      }),
    ).toBeNull();
  });

  it("summarizes per-side gate labels and changed flag", () => {
    const view = buildCompareGateOutcomeDeltaView({
      baselineKind: "Feasible",
      targetKind: "SoftInfeasible",
    });

    expect(view?.baseline.gateLabel.length).toBeGreaterThan(0);
    expect(view?.target.gateLabel.length).toBeGreaterThan(0);
    expect(view?.changed).toBe(true);
  });

  it("marks unchanged when both sides share a kind", () => {
    const view = buildCompareGateOutcomeDeltaView({
      baselineKind: "Feasible",
      targetKind: "Feasible",
    });

    expect(view?.changed).toBe(false);
  });
});
