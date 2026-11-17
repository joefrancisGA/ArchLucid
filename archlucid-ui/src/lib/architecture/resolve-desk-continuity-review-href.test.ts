import { describe, expect, it } from "vitest";

import {
  resolveDeskContinuityFindingInspectHref,
  resolveDeskContinuityProvenanceHref,
  resolveDeskContinuityReviewOpenHref,
} from "@/lib/architecture/resolve-desk-continuity-review-href";

describe("resolveDeskContinuityReviewHref", () => {
  it("opens nested review when architecture id is explicit", () => {
    expect(
      resolveDeskContinuityReviewOpenHref("run-1", { architectureId: "arch-desk" }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1");
  });

  it("uses pathname desk continuity for provenance child routes", () => {
    expect(
      resolveDeskContinuityProvenanceHref("run-1", {
        pathname: "/architecture/architectures/arch-continuity/reviews/run-1",
      }),
    ).toBe("/architecture/architectures/arch-continuity/reviews/run-1/provenance");
  });

  it("routes finding inspect through nested workspace when continuity is known", () => {
    expect(
      resolveDeskContinuityFindingInspectHref("run-1", "finding-9", { architectureId: "arch-desk" }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1/findings/finding-9");
  });
});
