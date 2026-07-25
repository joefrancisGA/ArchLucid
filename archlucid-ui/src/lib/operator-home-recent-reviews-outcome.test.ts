import { describe, expect, it } from "vitest";

import {
  formatOperatorHomeRecentReviewsOutcome,
  OPERATOR_HOME_RECENT_FEATURED_LIMIT,
} from "@/lib/operator-home-recent-reviews-outcome";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator-home-workspace-metrics";

describe("formatOperatorHomeRecentReviewsOutcome", () => {
  it("describes an empty workspace", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      reviewPackagesTotal: 0,
      reviewPackagesCommitted: 0,
      reviewPackagesActive: 0,
      openFindings: 0,
      governanceWarnings: 0,
      evidenceSources: 0,
      hasReviews: false,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).toBe(
      "No reviews in this workspace yet.",
    );
  });

  it("summarizes committed packages with finding pressure", () => {
    const metrics: OperatorHomeWorkspaceMetricsSnapshot = {
      reviewPackagesTotal: 3,
      reviewPackagesCommitted: 2,
      reviewPackagesActive: 1,
      openFindings: 6,
      governanceWarnings: 1,
      evidenceSources: 3,
      hasReviews: true,
    };

    expect(formatOperatorHomeRecentReviewsOutcome(metrics)).toBe(
      "2 committed · 1 active · 6 open findings · 1 with governance warnings",
    );
  });

  it("keeps the featured recent-review limit small", () => {
    expect(OPERATOR_HOME_RECENT_FEATURED_LIMIT).toBe(2);
  });
});
