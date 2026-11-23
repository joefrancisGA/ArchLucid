import { beforeEach, describe, expect, it, vi } from "vitest";
import { readRecentPrimaryReviewDeskTarget } from "@/lib/reviews/review-pin-run-url";

import {
  graphFindingDetailHref,
  graphFindingInspectHref,
  graphReviewRunExplanationHref,
  resolveGraphReviewDeskArchitectureId,
} from "@/lib/graph-finding-deep-links";

vi.mock("@/lib/reviews/review-pin-run-url", () => ({
  readRecentPrimaryReviewDeskTarget: vi.fn(() => ({
    primaryRunId: "run-1",
    architectureId: "arch-recent",
  })),
}));

describe("graph-finding-deep-links (desk continuity)", () => {
  // The global Vitest suite enables restoreMocks: true. Reapply the
  // canonical recent-review fixture after restoration for each test.
  beforeEach(() => {
    vi.mocked(readRecentPrimaryReviewDeskTarget).mockReturnValue({
      primaryRunId: "run-1",
      architectureId: "arch-recent",
    });
  });

  it("prefers explicit architecture id", () => {
    expect(
      resolveGraphReviewDeskArchitectureId("run-1", {
        architectureId: "arch-explicit",
        pathname: "/insights/evidence-graph",
      }),
    ).toBe("arch-explicit");
  });

  it("reads nested architecture id from pathname", () => {
    expect(
      resolveGraphReviewDeskArchitectureId("run-1", {
        pathname: "/architecture/architectures/acme/reviews/run-1",
      }),
    ).toBe("acme");
  });

  it("falls back to recent primary desk when run ids match", () => {
    expect(
      resolveGraphReviewDeskArchitectureId("run-1", {
        pathname: "/insights/evidence-graph",
      }),
    ).toBe("arch-recent");
  });

  it("builds nested run-explanation and finding hrefs when architecture is known", () => {
    expect(graphReviewRunExplanationHref("run-1", "arch-desk")).toBe(
      "/architecture/architectures/arch-desk/reviews/run-1#run-explanation",
    );

    expect(graphFindingDetailHref("run-1", "finding-9", "arch-desk")).toBe(
      "/architecture/architectures/arch-desk/reviews/run-1/findings/finding-9",
    );

    expect(graphFindingInspectHref("run-1", "finding-9", "arch-desk")).toBe(
      "/architecture/architectures/arch-desk/reviews/run-1/findings/finding-9/evidence-trace",
    );
  });

  it("keeps peer hrefs when architecture id is unknown", () => {
    expect(graphReviewRunExplanationHref("run-peer")).toBe(
      "/architecture/reviews/run-peer#run-explanation",
    );

    expect(graphFindingDetailHref("run-peer", "finding-9")).toBe(
      "/architecture/reviews/run-peer/findings/finding-9",
    );
  });
});
