import { describe, expect, it } from "vitest";

import {
  buildCreateHomeReviewTabHref,
  buildReviewWorkspaceTabHref,
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

describe("buildReviewWorkspaceTabHref (TB-2363)", () => {
  it("emits reviewTab only for committed review workspace tabs", () => {
    const href = buildReviewWorkspaceTabHref("run-1", "architecture");

    expect(href).toBe("/architecture/reviews/run-1?reviewTab=architecture");
    expect(href).not.toContain("archTab=");
  });

  it("opts into create-home chrome with includeCreateIntent", () => {
    const href = buildReviewWorkspaceTabHref("run-1", "activity", { includeCreateIntent: true });

    expect(href).toContain("reviewTab=activity");
    expect(href).toContain("fromGeneration=1");
    expect(href).toContain("intent=create-architecture");
    expect(href).not.toContain("archTab=");
  });

  it("appends hash when provided", () => {
    const href = buildReviewWorkspaceTabHref("run-1", "review-package", { hash: "sponsor-handoff" });

    expect(href).toBe("/architecture/reviews/run-1?reviewTab=review-package#sponsor-handoff");
  });

  it("maps create-home archTab ids through buildCreateHomeReviewTabHref", () => {
    const href = buildCreateHomeReviewTabHref("run-1", "diagram");

    expect(href).toContain("reviewTab=architecture");
    expect(href).toContain("fromGeneration=1");
    expect(href).not.toContain("archTab=");
  });
});
