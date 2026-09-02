import { describe, expect, it } from "vitest";

import { REVIEW_DETAIL_TAB_IDS } from "@/lib/review-detail-workspace-tabs";
import {
  NEEDS_ATTENTION_INBOX_PATH,
  PACKAGES_NAV_HREF,
  PACKAGES_NAV_LABEL,
  PRIORITY_FINDINGS_DISPLAY_LIMIT,
  splitReviewWorkspaceTabsByStage,
} from "@/lib/usability/usability-consolidation";

describe("usability-consolidation", () => {
  it("points packages nav at the reviews hub", () => {
    expect(PACKAGES_NAV_LABEL).toBe("Packages");
    expect(PACKAGES_NAV_HREF).toBe("/architecture/reviews");
  });

  it("defines the needs-attention inbox path", () => {
    expect(NEEDS_ATTENTION_INBOX_PATH).toBe("/governance/needs-attention");
  });

  it("limits priority findings to five sponsor-relevant rows", () => {
    expect(PRIORITY_FINDINGS_DISPLAY_LIMIT).toBe(5);
  });

  it("keeps every tab reachable via primary or more at each lifecycle stage", () => {
    for (const stage of [
      "draft",
      "analysis-in-progress",
      "pre-commit-complete",
      "committed",
    ] as const) {
      const split = splitReviewWorkspaceTabsByStage(stage, REVIEW_DETAIL_TAB_IDS);
      const combined = [...split.primaryTabIds, ...split.moreTabIds];

      expect(new Set(combined).size).toBe(REVIEW_DETAIL_TAB_IDS.length);
      expect([...combined].sort()).toEqual([...REVIEW_DETAIL_TAB_IDS].sort());
    }
  });

  it("promotes activity during analysis and review-package after commit", () => {
    const inProgress = splitReviewWorkspaceTabsByStage("analysis-in-progress", REVIEW_DETAIL_TAB_IDS);
    const committed = splitReviewWorkspaceTabsByStage("committed", REVIEW_DETAIL_TAB_IDS);

    expect(inProgress.primaryTabIds[0]).toBe("activity");
    expect(committed.primaryTabIds[0]).toBe("review-package");
    expect(inProgress.moreTabIds).toContain("review-package");
    expect(committed.moreTabIds).toContain("activity");
  });
});
