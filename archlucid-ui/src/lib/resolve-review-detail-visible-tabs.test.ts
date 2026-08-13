import { describe, expect, it } from "vitest";

import {
  coerceReviewDetailTabToVisible,
  isReviewDetailTabAdvanced,
  resolveReviewDetailTabForVisit,
  resolveReviewDetailTabLifecycleStage,
  resolveReviewDetailVisibleTabs,
} from "@/lib/resolve-review-detail-visible-tabs";
import { REVIEW_DETAIL_TAB_IDS } from "@/lib/review-detail-workspace-tabs";

describe("resolveReviewDetailTabLifecycleStage", () => {
  it("returns committed when a signed review record exists", () => {
    expect(
      resolveReviewDetailTabLifecycleStage({
        manifestId: "manifest-1",
        showProgressTracker: true,
        runCompleted: true,
      }),
    ).toBe("committed");
  });

  it("returns analysis-in-progress before completion", () => {
    expect(
      resolveReviewDetailTabLifecycleStage({
        manifestId: null,
        showProgressTracker: true,
        runCompleted: false,
      }),
    ).toBe("analysis-in-progress");
  });

  it("defaults the in-progress stage to the tab that hosts the progress tracker", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: true,
      runCompleted: false,
    });

    expect(resolved.visibleTabIds).toContain("activity");
    expect(resolved.defaultTabId).toBe("activity");
  });

  it("returns pre-commit-complete when analysis finished without a record", () => {
    expect(
      resolveReviewDetailTabLifecycleStage({
        manifestId: "  ",
        showProgressTracker: false,
        runCompleted: true,
      }),
    ).toBe("pre-commit-complete");
  });

  it("returns draft otherwise", () => {
    expect(
      resolveReviewDetailTabLifecycleStage({
        manifestId: null,
        showProgressTracker: false,
        runCompleted: false,
      }),
    ).toBe("draft");
  });
});

describe("resolveReviewDetailVisibleTabs", () => {
  it("covers every tab exactly once across primary and advanced", () => {
    for (const input of [
      { manifestId: null, showProgressTracker: false, runCompleted: false },
      { manifestId: null, showProgressTracker: true, runCompleted: false },
      { manifestId: null, showProgressTracker: false, runCompleted: true },
      { manifestId: "m-1", showProgressTracker: false, runCompleted: true },
    ] as const) {
      const resolved = resolveReviewDetailVisibleTabs(input);
      const combined = [...resolved.visibleTabIds, ...resolved.advancedCollapsedTabIds];

      expect(new Set(combined).size).toBe(combined.length);
      expect(combined.sort()).toEqual([...REVIEW_DETAIL_TAB_IDS].sort());
    }
  });

  it("keeps a consistent primary strip across lifecycle stages", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });

    expect(resolved.stage).toBe("draft");
    expect(resolved.visibleTabIds).toEqual(["overview", "findings", "evidence", "activity"]);
    expect(resolved.advancedCollapsedTabIds).toEqual([
      "policies",
      "decisions-remediation",
      "review-package",
      "architecture",
    ]);
    expect(resolved.defaultTabId).toBe("overview");
  });

  it("promotes findings as the default tab after analysis completes", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: false,
      runCompleted: true,
    });

    expect(resolved.stage).toBe("pre-commit-complete");
    expect(resolved.visibleTabIds).toContain("findings");
    expect(resolved.defaultTabId).toBe("findings");
  });

  it("keeps architecture package and decisions under More after commit", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });

    expect(resolved.stage).toBe("committed");
    expect(resolved.visibleTabIds).toEqual(["overview", "findings", "evidence", "activity"]);
    expect(resolved.advancedCollapsedTabIds).toEqual([
      "policies",
      "decisions-remediation",
      "review-package",
      "architecture",
    ]);
    expect(resolved.defaultTabId).toBe("review-package");
  });
});

describe("resolveReviewDetailTabForVisit", () => {
  it("lands on Activity while analysis runs so progress is visible without a tab click", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: true,
      runCompleted: false,
    });

    expect(resolved.defaultTabId).toBe("activity");
    expect(resolveReviewDetailTabForVisit(null, resolved)).toBe("activity");
    expect(resolveReviewDetailTabForVisit(undefined, resolved)).toBe("activity");
    expect(resolveReviewDetailTabForVisit("not-a-tab", resolved)).toBe("activity");
  });

  it("honors an explicit tab request over the stage default", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: true,
      runCompleted: false,
    });

    expect(resolveReviewDetailTabForVisit("overview", resolved)).toBe("overview");
    expect(resolveReviewDetailTabForVisit("findings", resolved)).toBe("findings");
  });

  it("applies the stage default at every stage when no tab is named", () => {
    for (const testCase of [
      { input: { manifestId: null, showProgressTracker: false, runCompleted: false }, expected: "overview" },
      { input: { manifestId: null, showProgressTracker: true, runCompleted: false }, expected: "activity" },
      { input: { manifestId: null, showProgressTracker: false, runCompleted: true }, expected: "findings" },
      { input: { manifestId: "m-1", showProgressTracker: false, runCompleted: true }, expected: "review-package" },
    ] as const) {
      const resolved = resolveReviewDetailVisibleTabs(testCase.input);

      expect(resolveReviewDetailTabForVisit(null, resolved)).toBe(testCase.expected);
    }
  });
});

describe("coerceReviewDetailTabToVisible", () => {
  it("keeps deep-linked advanced tabs", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: null,
      showProgressTracker: false,
      runCompleted: false,
    });

    expect(coerceReviewDetailTabToVisible("findings", resolved)).toBe("findings");
  });

  it("falls back to stage default for unknown tabs", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });

    expect(coerceReviewDetailTabToVisible("overview", resolved)).toBe("overview");
  });
});

describe("isReviewDetailTabAdvanced", () => {
  it("marks collapsed tabs as advanced", () => {
    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: "manifest-1",
      showProgressTracker: false,
      runCompleted: true,
    });

    expect(isReviewDetailTabAdvanced("architecture", resolved)).toBe(true);
    expect(isReviewDetailTabAdvanced("findings", resolved)).toBe(false);
  });
});