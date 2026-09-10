import { describe, expect, it } from "vitest";

import { defaultDeskContinuityDto } from "@/lib/api/user-preferences-types";
import { applyReadBackfillDeskContinuity, mergeDeskContinuity } from "@/lib/desk-continuity-preference";

describe("desk continuity architecture locator (AO-48)", () => {
  it("merges lastOpenArchitectureId through desk continuity patch", () => {
    const merged = mergeDeskContinuity(defaultDeskContinuityDto(), {
      lastOpenArchitectureId: "architecture-identity-001",
      lastOpenReviewId: "run-child-1",
    });

    expect(merged.lastOpenArchitectureId).toBe("architecture-identity-001");
    expect(merged.lastOpenReviewId).toBe("run-child-1");
  });

  it("defaults lastOpenArchitectureId to null when unset", () => {
    expect(defaultDeskContinuityDto().lastOpenArchitectureId).toBeNull();
  });

  it("backfills architecture id from review lookup without dropping child review id", () => {
    const backfilled = applyReadBackfillDeskContinuity(
      {
        lastOpenReviewId: "run-child-1",
        lastOpenDraftId: "draft-1",
        lastVisitWatermarkUtc: "2026-09-05T12:00:00Z",
      },
      "architecture-identity-001",
    );

    expect(backfilled.lastOpenArchitectureId).toBe("architecture-identity-001");
    expect(backfilled.lastOpenReviewId).toBe("run-child-1");
    expect(backfilled.lastOpenDraftId).toBe("draft-1");
  });

  it("does not overwrite an existing architecture locator during backfill", () => {
    const backfilled = applyReadBackfillDeskContinuity(
      {
        lastOpenArchitectureId: "architecture-existing",
        lastOpenReviewId: "run-child-1",
      },
      "architecture-other",
    );

    expect(backfilled.lastOpenArchitectureId).toBe("architecture-existing");
  });
});
