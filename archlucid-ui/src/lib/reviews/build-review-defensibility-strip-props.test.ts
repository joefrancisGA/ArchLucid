import { describe, expect, it } from "vitest";

import { buildReviewDefensibilityStripProps } from "@/lib/reviews/build-review-defensibility-strip-props";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

const verdict: ManifestFeasibilityVerdict = {
  kind: "feasible",
  transparencyTrail: {
    asserted: ["outcome"],
    inferred: ["latency"],
    skipped: ["security"],
  },
};

describe("buildReviewDefensibilityStripProps", () => {
  it("maps transparency trail counts and verdict label", () => {
    const props = buildReviewDefensibilityStripProps(verdict, false);

    expect(props?.assertedCount).toBe(1);
    expect(props?.inferredCount).toBe(1);
    expect(props?.skippedCount).toBe(1);
    expect(props?.criticAbsent).toBe(false);
    expect(props?.verdictKind).toBeTruthy();
  });

  it("returns critic-only strip when verdict is absent but critic was not run", () => {
    const props = buildReviewDefensibilityStripProps(null, true);

    expect(props).toEqual({
      assertedCount: 0,
      inferredCount: 0,
      skippedCount: 0,
      criticAbsent: true,
      verdictKind: null,
    });
  });
});
