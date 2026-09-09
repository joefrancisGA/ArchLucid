import { describe, expect, it } from "vitest";

import {
  CREATE_HOME_REVIEW_WORKSPACE_TAB_IDS,
  resolveActiveReviewDetailTabFromSearchParams,
  resolveReviewWorkspaceTabForVisit,
  resolveReviewWorkspaceTabFromSearchParams,
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
    expect(resolved.visibleTabIds).toEqual([
      "overview",
      "findings",
      "evidence",
      "policies",
      "decisions-remediation",
      "review-package",
      "architecture",
      "activity",
    ]);
  });

  it("lands Working desk visits on Findings for finalized packages (PC-11)", () => {
    const resolved = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "finalized",
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
      workingDesk: true,
    });

    expect(resolveReviewWorkspaceTabForVisit(null, resolved, "finalized")).toBe("findings");
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

  it("hydrates legacy archTab deep links on initial visit", () => {
    const finalized = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "finalized",
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });
    const searchParams = new URLSearchParams("archTab=diagram");

    expect(resolveReviewWorkspaceTabFromSearchParams(searchParams, finalized, "finalized")).toBe("architecture");
  });

  it("keeps stage defaults when neither reviewTab nor archTab is present", () => {
    const finalized = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "finalized",
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
      workingDesk: true,
    });
    const searchParams = new URLSearchParams();

    expect(resolveReviewWorkspaceTabFromSearchParams(searchParams, finalized, "finalized")).toBe("findings");

    expect(
      resolveActiveReviewDetailTabFromSearchParams({
        searchParams,
        tabLifecycle: {
          manifestId: "manifest-1",
          showProgressTracker: false,
          runCompleted: true,
        },
        lifecycle: "finalized",
        workingDesk: true,
      }),
    ).toBe("findings");
  });
});
