import { describe, expect, it, vi } from "vitest";

import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";

vi.mock("@/lib/desk-continuity-preference", () => ({
  extractArchitectureIdentityIdFromPathname: vi.fn(() => null),
  readCachedLastOpenArchitectureId: vi.fn(() => "arch-cached"),
}));

vi.mock("@/lib/reviews/review-pin-run-url", () => ({
  readRecentPrimaryReviewDeskTarget: vi.fn(() => ({
    primaryRunId: "run-recent",
    architectureId: "arch-recent",
  })),
}));

describe("resolveGlobalSearchDeskArchitectureId", () => {
  it("prefers wire architecture id", () => {
    expect(
      resolveGlobalSearchDeskArchitectureId({
        runId: "run-1",
        architectureId: "arch-wire",
      }),
    ).toBe("arch-wire");
  });

  it("uses recent primary desk when run ids match", () => {
    expect(
      resolveGlobalSearchDeskArchitectureId({
        runId: "run-recent",
        pathname: "/insights/ask-review-questions",
      }),
    ).toBe("arch-recent");
  });

  it("falls back to cached last-open architecture", () => {
    expect(
      resolveGlobalSearchDeskArchitectureId({
        runId: "run-other",
        pathname: "/insights/ask-review-questions",
      }),
    ).toBe("arch-cached");
  });
});
