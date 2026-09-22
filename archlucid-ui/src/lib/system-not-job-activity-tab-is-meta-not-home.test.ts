import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveReviewDetailTabForVisit,
  resolveReviewDetailVisibleTabs,
} from "@/lib/resolve-review-detail-visible-tabs";
import { REVIEW_DETAIL_DEFAULT_TAB, REVIEW_DETAIL_TAB_IDS } from "@/lib/review-detail-workspace-tabs";
import {
  resolveActiveReviewDetailTabFromSearchParams,
  resolveReviewWorkspaceVisibleTabs,
} from "@/lib/resolve-review-workspace-visible-tabs";
import {
  resolveSystemNotJobWorkingReviewDetailDefaultTab,
  SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_DOC_ANCHOR,
  SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_OWNER,
  WORKING_REVIEW_DETAIL_BANNED_DEFAULT_TABS,
} from "@/lib/system-not-job-activity-tab-is-meta-not-home";

const REPO_ROOT = join(process.cwd(), "..");

describe("SN-022 Activity tab is meta, not the work object", () => {
  it("never defaults Working desk visits to Activity at any lifecycle stage", () => {
    for (const input of [
      { manifestId: null, showProgressTracker: false, runCompleted: false },
      { manifestId: null, showProgressTracker: true, runCompleted: false },
      { manifestId: null, showProgressTracker: false, runCompleted: true },
      { manifestId: "manifest-1", showProgressTracker: false, runCompleted: true },
    ] as const) {
      const resolved = resolveReviewDetailVisibleTabs({ ...input, workingDesk: true });

      expect(resolved.defaultTabId).not.toBe("activity");
      expect(resolveReviewDetailTabForVisit(null, resolved)).not.toBe("activity");
      expect(resolved.visibleTabIds).toContain("activity");
    }
  });

  it("lands Working analysis-in-progress visits on Overview, not Activity", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: true,
      runCompleted: false,
      workingDesk: true,
    });

    expect(resolved.stage).toBe("analysis-in-progress");
    expect(resolved.defaultTabId).toBe(REVIEW_DETAIL_DEFAULT_TAB);
    expect(resolveReviewDetailTabForVisit(null, resolved)).toBe("overview");
    expect(resolveReviewDetailTabForVisit("activity", resolved)).toBe("activity");
  });

  it("keeps Guided analysis-in-progress default on Activity for progress visibility", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: true,
      runCompleted: false,
      workingDesk: false,
    });

    expect(resolved.defaultTabId).toBe("activity");
    expect(resolveReviewDetailTabForVisit(null, resolved)).toBe("activity");
  });

  it("resolves Working stage defaults through the SN-022 helper", () => {
    expect(resolveSystemNotJobWorkingReviewDetailDefaultTab("draft")).toBe("overview");
    expect(resolveSystemNotJobWorkingReviewDetailDefaultTab("analysis-in-progress")).toBe("overview");
    expect(resolveSystemNotJobWorkingReviewDetailDefaultTab("pre-commit-complete")).toBe("findings");
    expect(resolveSystemNotJobWorkingReviewDetailDefaultTab("committed")).toBe("findings");
    expect(WORKING_REVIEW_DETAIL_BANNED_DEFAULT_TABS).toEqual(["activity"]);
  });

  it("wires Working workspace tab resolution through stage defaults", () => {
    const resolved = resolveReviewWorkspaceVisibleTabs({
      lifecycle: "finalized",
      manifestId: null,
      showProgressTracker: true,
      runCompleted: false,
      workingDesk: true,
    });
    const searchParams = new URLSearchParams();

    expect(
      resolveActiveReviewDetailTabFromSearchParams({
        searchParams,
        tabLifecycle: {
          manifestId: null,
          showProgressTracker: true,
          runCompleted: false,
        },
        lifecycle: "finalized",
        workingDesk: true,
      }),
    ).toBe("overview");

    expect(resolved.visibleTabIds).toEqual(REVIEW_DETAIL_TAB_IDS);
    expect(resolved.moreTabIds).toEqual([]);
  });

  it("names ADR 0079 anchor and default-tab resolver surfaces", () => {
    const resolver = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/resolve-review-detail-visible-tabs.ts"),
      "utf8",
    );

    expect(SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_OWNER).toBe("SN-022");
    expect(SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_DOC_ANCHOR).toContain("0079");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_ACTIVITY_TAB_IS_META_NOT_HOME_DOC_ANCHOR))).toBe(true);
    expect(resolver).toContain("resolveSystemNotJobWorkingReviewDetailDefaultTab");
  });
});
