import { describe, expect, it, vi } from "vitest";

import { resolveAskGroundingLinkHref } from "@/lib/ask/resolve-ask-grounding-link-href";

vi.mock("@/lib/insights/scoped-insight-open-review-href", () => ({
  resolveScopedInsightOpenReviewHrefWithDeskContinuity: vi.fn((_runId: string) =>
    "/architecture/architectures/arch-cached/reviews/run-1",
  ),
}));

describe("resolveAskGroundingLinkHref", () => {
  it("upgrades flat peer review cites to nested desk when continuity resolves", () => {
    expect(resolveAskGroundingLinkHref("/architecture/reviews/run-1?reviewTab=findings")).toBe(
      "/architecture/architectures/arch-cached/reviews/run-1?reviewTab=findings",
    );
  });

  it("preserves hash segments on upgraded hrefs", () => {
    expect(resolveAskGroundingLinkHref("/architecture/reviews/run-1#run-detail-first-review-spine-findings")).toBe(
      "/architecture/architectures/arch-cached/reviews/run-1#run-detail-first-review-spine-findings",
    );
  });

  it("returns non-review hrefs unchanged", () => {
    expect(resolveAskGroundingLinkHref("/governance/findings?runId=run-1")).toBe(
      "/governance/findings?runId=run-1",
    );
  });
});
