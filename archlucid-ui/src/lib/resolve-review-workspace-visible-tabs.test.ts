import { describe, expect, it } from "vitest";

import {
  CREATE_HOME_REVIEW_WORKSPACE_TAB_IDS,
  resolveReviewWorkspaceTabForVisit,
  resolveReviewWorkspaceVisibleTabs,
} from "@/lib/resolve-review-workspace-visible-tabs";

describe("resolveReviewWorkspaceVisibleTabs (TB-2367)", () => {
  it("returns create-home primary tabs without review-package", () => {
    const resolved = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "create-home",
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });

    expect(resolved.visibleTabIds).toEqual(CREATE_HOME_REVIEW_WORKSPACE_TAB_IDS);
    expect(resolved.advancedCollapsedTabIds).toEqual([]);
    expect(resolved.visibleTabIds).not.toContain("review-package");
  });

  it("delegates committed lifecycles to review detail tab density rules", () => {
    const resolved = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "finalized",
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });

    expect(resolved.stage).toBe("committed");
    expect(resolved.defaultTabId).toBe("review-package");
    expect(resolved.advancedCollapsedTabIds.length).toBeGreaterThan(0);
  });

  it("keeps canonical reviewTab ids across lifecycles for deep links", () => {
    const createHome = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "create-home",
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });
    const finalized = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "finalized",
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });

    expect(resolveReviewWorkspaceTabForVisit("findings", createHome, "create-home")).toBe("findings");
    expect(resolveReviewWorkspaceTabForVisit("architecture", finalized, "finalized")).toBe("architecture");
    expect(resolveReviewWorkspaceTabForVisit("decisions-remediation", createHome, "create-home")).toBe(
      "decisions-remediation",
    );
  });
});
