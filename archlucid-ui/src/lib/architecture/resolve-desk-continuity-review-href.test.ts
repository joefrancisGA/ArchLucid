import { describe, expect, it, vi } from "vitest";

import {
  resolveDeskContinuityFindingInspectHref,
  resolveDeskContinuityProvenanceHref,
  resolveDeskContinuityReviewOpenHref,
} from "@/lib/architecture/resolve-desk-continuity-review-href";

vi.mock("@/lib/global-search-desk-architecture-id", () => ({
  resolveGlobalSearchDeskArchitectureId: vi.fn(() => null),
}));

describe("resolveDeskContinuityReviewHref", () => {
  it("opens nested review when architecture id is explicit", () => {
    expect(
      resolveDeskContinuityReviewOpenHref("run-1", { architectureId: "arch-desk" }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1");
  });

  it("uses desk continuity for provenance child routes", async () => {
    const { resolveGlobalSearchDeskArchitectureId } = await import("@/lib/global-search-desk-architecture-id");

    vi.mocked(resolveGlobalSearchDeskArchitectureId).mockReturnValueOnce("arch-continuity");

    expect(resolveDeskContinuityProvenanceHref("run-1")).toBe(
      "/architecture/architectures/arch-continuity/reviews/run-1/provenance",
    );
  });

  it("routes finding inspect through nested workspace when continuity is known", () => {
    expect(
      resolveDeskContinuityFindingInspectHref("run-1", "finding-9", { architectureId: "arch-desk" }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1/findings/finding-9");
  });
});
