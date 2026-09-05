import { describe, expect, it } from "vitest";

import { resolveOpenPackageRunId } from "./resolve-open-package-run-id";

describe("resolveOpenPackageRunId (LS-05)", () => {
  it("prefers the review id in the current path", () => {
    expect(
      resolveOpenPackageRunId({
        pathname: "/architecture/reviews/run-in-path",
        lastOpenReviewId: "run-last",
      }),
    ).toBe("run-in-path");
  });

  it("falls back to last-open review when path has no package", () => {
    expect(
      resolveOpenPackageRunId({
        pathname: "/",
        lastOpenReviewId: "run-last",
      }),
    ).toBe("run-last");
  });

  it("returns null when no package can be resolved", () => {
    expect(
      resolveOpenPackageRunId({
        pathname: "/insights/compare-two-reviews",
        lastOpenReviewId: null,
      }),
    ).toBeNull();
  });
});
