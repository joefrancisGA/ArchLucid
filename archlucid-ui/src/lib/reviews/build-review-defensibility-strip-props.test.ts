import { describe, expect, it } from "vitest";

import { buildReviewDefensibilityStripProps } from "@/lib/reviews/build-review-defensibility-strip-props";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

const verdict: ManifestFeasibilityVerdict = {
  kind: "feasible",
  summary: "Ready",
  transparencyTrail: {
    asserted: [{ key: "outcome", value: "ok" }],
    inferred: [{ key: "latency", value: "low", confidence: 0.9 }],
    skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
  },
};

describe("buildReviewDefensibilityStripProps", () => {
  it("maps transparency trail counts and verdict label", () => {
    const props = buildReviewDefensibilityStripProps(verdict, {
      pipelineInFlight: false,
      criticAbsent: false,
    });

    expect(props?.assertedCount).toBe(1);
    expect(props?.inferredCount).toBe(1);
    expect(props?.skippedCount).toBe(1);
    expect(props?.criticAbsent).toBe(false);
    expect(props?.verdictKind).toBeTruthy();
  });

  it("returns critic-only strip when verdict is absent but critic was not run", () => {
    const props = buildReviewDefensibilityStripProps(null, {
      pipelineInFlight: true,
      criticAbsent: true,
    });

    expect(props).toEqual({
      assertedCount: null,
      inferredCount: null,
      skippedCount: null,
      pipelineInFlight: true,
      criticAbsent: true,
      verdictKind: null,
    });
  });

  it("returns null trail counts when transparency trail is absent on the verdict", () => {
    const props = buildReviewDefensibilityStripProps(
      { kind: "feasible", summary: "Ready", transparencyTrail: undefined } as ManifestFeasibilityVerdict,
      { pipelineInFlight: false, criticAbsent: false },
    );

    expect(props?.assertedCount).toBeNull();
    expect(props?.inferredCount).toBeNull();
    expect(props?.skippedCount).toBeNull();
  });
});
