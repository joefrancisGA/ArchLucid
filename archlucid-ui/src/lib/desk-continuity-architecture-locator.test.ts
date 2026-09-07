import { describe, expect, it } from "vitest";

import { defaultDeskContinuityDto } from "@/lib/api/user-preferences-types";
import { mergeDeskContinuity } from "@/lib/desk-continuity-preference";

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
});
