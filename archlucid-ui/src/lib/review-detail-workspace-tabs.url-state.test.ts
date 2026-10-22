import { describe, expect, it } from "vitest";

import {
  buildReviewDetailTabHref,
  resolveReviewWorkbenchFocusColumn,
} from "@/lib/review-detail-workspace-tabs";

describe("review-detail-workspace-tabs url state", () => {
  it("buildReviewDetailTabHref includes findingId and workbenchFocus", () => {
    const href = buildReviewDetailTabHref("run-1", "findings", {
      findingId: "f-9",
      workbenchFocus: "evidence",
    });

    expect(href).toContain("reviewTab=findings");
    expect(href).toContain("findingId=f-9");
    expect(href).toContain("workbenchFocus=evidence");
  });

  it("resolveReviewWorkbenchFocusColumn ignores invalid values", () => {
    expect(resolveReviewWorkbenchFocusColumn("findings")).toBe("findings");
    expect(resolveReviewWorkbenchFocusColumn("overview")).toBeNull();
  });
});
