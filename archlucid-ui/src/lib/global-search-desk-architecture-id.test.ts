import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveGlobalSearchDeskArchitectureId } from "@/lib/global-search-desk-architecture-id";
import {
  extractArchitectureIdentityIdFromPathname,
  readCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
import { readRecentPrimaryReviewDeskTarget } from "@/lib/reviews/review-pin-run-url";

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
  // This suite shares the repository's restoreMocks:true Vitest setup.
  // Re-seed factory mocks per case so preceding tests cannot leave a
  // disabled/no-op cache or recent-review fixture.
  beforeEach(() => {
    vi.mocked(extractArchitectureIdentityIdFromPathname).mockReturnValue(null);
    vi.mocked(readCachedLastOpenArchitectureId).mockReturnValue("arch-cached");
    vi.mocked(readRecentPrimaryReviewDeskTarget).mockReturnValue({
      primaryRunId: "run-recent",
      architectureId: "arch-recent",
    });
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
