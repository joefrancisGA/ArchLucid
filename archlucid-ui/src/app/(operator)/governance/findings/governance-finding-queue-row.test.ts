import { describe, expect, it, vi } from "vitest";

import { readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { governanceFindingQueueRowReviewHref } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: vi.fn(() => null),
}));

describe("governanceFindingQueueRowReviewHref", () => {
  it("falls back to flat review when desk cache is empty", () => {
    expect(governanceFindingQueueRowReviewHref("run-queue-1")).toBe("/architecture/reviews/run-queue-1");
  });

  it("opens nested review when desk continuity cache is set", () => {
    vi.mocked(readCachedLastOpenArchitectureId).mockReturnValue("architecture-queue-001");

    expect(governanceFindingQueueRowReviewHref("run-queue-2")).toBe(
      "/architecture/architectures/architecture-queue-001/reviews/run-queue-2",
    );
  });
});
