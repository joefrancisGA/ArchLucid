import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";
// Pure fixture callbacks cannot be reset by the global restoreMocks lifecycle.
const deskFixture = vi.hoisted(() => ({
  pathId: null as string | null,
  cachedId: "arch-cached" as string | null,
  recent: {
    primaryRunId: "run-recent",
    architectureId: "arch-recent",
  },
}));

vi.mock("@/lib/desk-continuity-preference", () => ({
  extractArchitectureIdentityIdFromPathname: () => deskFixture.pathId,
  readCachedLastOpenArchitectureId: () => deskFixture.cachedId,
}));

vi.mock("@/lib/reviews/review-pin-run-url", () => ({
  readRecentPrimaryReviewDeskTarget: () => deskFixture.recent,
}));

describe("resolveGlobalSearchDeskArchitectureId", () => {
  beforeEach(() => {
    deskFixture.pathId = null;
    deskFixture.cachedId = "arch-cached";
    deskFixture.recent = { primaryRunId: "run-recent", architectureId: "arch-recent" };
  });

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
