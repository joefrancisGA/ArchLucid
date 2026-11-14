import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { writeCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { governanceFindingQueueRowReviewHref } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

beforeEach(() => writeCachedLastOpenArchitectureId(null));
afterEach(() => writeCachedLastOpenArchitectureId(null));

describe("governanceFindingQueueRowReviewHref", () => {
  it("falls back to flat review when desk cache is empty", () => {
    expect(governanceFindingQueueRowReviewHref("run-queue-1")).toBe("/architecture/reviews/run-queue-1");
  });

  it("opens nested review when desk continuity cache is set", () => {
    writeCachedLastOpenArchitectureId("architecture-queue-001");

    expect(governanceFindingQueueRowReviewHref("run-queue-2")).toBe(
      "/architecture/architectures/architecture-queue-001/reviews/run-queue-2",
    );
  });
});
