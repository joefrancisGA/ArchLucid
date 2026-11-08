import { describe, expect, it, vi } from "vitest";

const resolveDeskAwareReviewOpenHref = vi.hoisted(() =>
  vi.fn((runId: string, pathname: string | null | undefined) => `desk-aware:${runId}:${pathname ?? ""}`),
);

vi.mock("@/lib/architecture/review-url-state-pathname", () => ({
  resolveDeskAwareReviewOpenHref,
}));

import { resolveReviewHref } from "./integration-events-dlq-presentation";

describe("integration-events-dlq-presentation", () => {
  it("resolveReviewHref uses flat peer when route pathname is not available", () => {
    expect(resolveReviewHref("run-abc")).toBe("/architecture/reviews/run-abc");
    expect(resolveDeskAwareReviewOpenHref).not.toHaveBeenCalled();
  });

  it("resolveReviewHref delegates to desk-aware resolver when route pathname is provided", () => {
    expect(resolveReviewHref("run-abc", "/internal/failed-integration-messages")).toBe(
      "desk-aware:run-abc:/internal/failed-integration-messages",
    );
    expect(resolveDeskAwareReviewOpenHref).toHaveBeenCalledWith("run-abc", "/internal/failed-integration-messages");
  });
});
