import { describe, expect, it } from "vitest";

import { resolveReviewWorkbenchFocusColumn } from "@/lib/review-detail-workspace-tabs";

describe("review-detail workbench focus restore", () => {
  it("restores focus column from workbenchFocus query param", () => {
    expect(resolveReviewWorkbenchFocusColumn("evidence")).toBe("evidence");
    expect(resolveReviewWorkbenchFocusColumn("findings")).toBe("findings");
  });

  it("ignores non-workbench tabs for focus restore", () => {
    expect(resolveReviewWorkbenchFocusColumn("overview")).toBeNull();
    expect(resolveReviewWorkbenchFocusColumn(null)).toBeNull();
  });
});
