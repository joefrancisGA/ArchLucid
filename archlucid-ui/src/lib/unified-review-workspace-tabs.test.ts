import { describe, expect, it } from "vitest";

import {
  mapArchitectureTabToReviewTab,
  mapReviewTabToArchitectureTab,
  resolveUnifiedReviewWorkspaceTab,
} from "@/lib/unified-review-workspace-tabs";

describe("unified-review-workspace-tabs (TB-2355)", () => {
  it("maps legacy archTab values to canonical reviewTab ids", () => {
    expect(resolveUnifiedReviewWorkspaceTab(null, "diagram")).toBe("architecture");
    expect(resolveUnifiedReviewWorkspaceTab(null, "governance")).toBe("policies");
    expect(resolveUnifiedReviewWorkspaceTab("findings", "diagram")).toBe("findings");
  });

  it("round-trips create-home tabs through the mapping tables", () => {
    expect(mapArchitectureTabToReviewTab("diagram")).toBe("architecture");
    expect(mapReviewTabToArchitectureTab("architecture")).toBe("diagram");
  });
});
