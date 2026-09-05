import { describe, expect, it } from "vitest";

import {
  extractArchitectureDraftIdFromPathname,
  extractReviewIdFromPathname,
  mergeDeskContinuity,
} from "@/lib/desk-continuity-preference";
import { defaultDeskContinuityDto } from "@/lib/api/user-preferences-types";

describe("desk-continuity-preference (IS-13)", () => {
  it("merges partial patches without dropping other fields", () => {
    const merged = mergeDeskContinuity(
      {
        lastOpenReviewId: "run-1",
        lastOpenDraftId: "arch-2",
        lastVisitWatermarkUtc: "2026-09-05T12:00:00Z",
      },
      { lastOpenReviewId: "run-9" },
    );

    expect(merged.lastOpenReviewId).toBe("run-9");
    expect(merged.lastOpenDraftId).toBe("arch-2");
    expect(merged.lastVisitWatermarkUtc).toBe("2026-09-05T12:00:00Z");
  });

  it("extracts review and draft ids from operator paths", () => {
    expect(extractReviewIdFromPathname("/architecture/reviews/run-42")).toBe("run-42");
    expect(extractArchitectureDraftIdFromPathname("/architecture/architectures/arch-7")).toBe("arch-7");
    expect(extractArchitectureDraftIdFromPathname("/architecture/architectures/new")).toBeNull();
  });

  it("defaults empty continuity", () => {
    expect(defaultDeskContinuityDto()).toEqual({
      lastOpenReviewId: null,
      lastOpenDraftId: null,
      lastVisitWatermarkUtc: null,
    });
  });
});
