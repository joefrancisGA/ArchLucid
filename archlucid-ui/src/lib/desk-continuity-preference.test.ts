import { describe, expect, it } from "vitest";

import {
  extractArchitectureDraftIdFromPathname,
  extractArchitectureIdentityIdFromPathname,
  extractReviewIdFromPathname,
  mergeDeskContinuity,
} from "@/lib/desk-continuity-preference";
import { defaultDeskContinuityDto } from "@/lib/api/user-preferences-types";

describe("desk-continuity-preference (IS-13 / AO-16)", () => {
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
    expect(extractReviewIdFromPathname("/architecture/architectures/arch-7/reviews/run-42")).toBe("run-42");
    expect(extractArchitectureDraftIdFromPathname("/architecture/architectures/arch-7")).toBe("arch-7");
    expect(extractArchitectureDraftIdFromPathname("/architecture/architectures/arch-7/drafts/draft-3")).toBe(
      "draft-3",
    );
    expect(extractArchitectureDraftIdFromPathname("/architecture/architectures/new")).toBeNull();
  });

  it("extracts architecture identity from desk and nested job paths", () => {
    expect(
      extractArchitectureIdentityIdFromPathname("/architecture/architectures/architecture-identity-001", ""),
    ).toBe("architecture-identity-001");
    expect(
      extractArchitectureIdentityIdFromPathname(
        "/architecture/architectures/architecture-identity-001/reviews/run-1",
        "",
      ),
    ).toBe("architecture-identity-001");
    expect(
      extractArchitectureIdentityIdFromPathname(
        "/architecture/architectures/architecture-identity-001/drafts/draft-1",
        "",
      ),
    ).toBe("architecture-identity-001");
    expect(
      extractArchitectureIdentityIdFromPathname(
        "/architecture/architectures/architecture-identity-001?draft=draft-001",
        "?draft=draft-001",
      ),
    ).toBeNull();
  });

  it("defaults empty continuity", () => {
    expect(defaultDeskContinuityDto()).toEqual({
      lastOpenReviewId: null,
      lastOpenDraftId: null,
      lastVisitWatermarkUtc: null,
    });
  });
});
