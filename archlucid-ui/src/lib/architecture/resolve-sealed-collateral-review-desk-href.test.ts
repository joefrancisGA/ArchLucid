import { describe, expect, it, vi } from "vitest";

import { resolveSealedCollateralReviewDeskHref } from "@/lib/architecture/resolve-sealed-collateral-review-desk-href";

vi.mock("@/lib/reviews/review-pin-run-url", () => ({
  readRecentPrimaryReviewDeskTarget: (): { primaryRunId: string; architectureId: string | null } | null => null,
}));

describe("resolveSealedCollateralReviewDeskHref", () => {
  it("uses nested review base when pathname carries architecture continuity", () => {
    expect(
      resolveSealedCollateralReviewDeskHref({
        runId: "run-1",
        pathname: "/governance/signed-records/manifest-1",
        architectureId: "arch-desk",
      }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1");
  });

  it("uses peer review URL when architecture is unknown", () => {
    expect(
      resolveSealedCollateralReviewDeskHref({
        runId: "run-peer",
        pathname: "/governance/signed-records/manifest-2",
      }),
    ).toBe("/architecture/reviews/run-peer");
  });

  it("builds nested finding paths when findingIdOnPath is set", () => {
    expect(
      resolveSealedCollateralReviewDeskHref({
        runId: "run-1",
        architectureId: "arch-desk",
        findingId: "finding-9",
        findingIdOnPath: true,
      }),
    ).toBe("/architecture/architectures/arch-desk/reviews/run-1/findings/finding-9");
  });
});
