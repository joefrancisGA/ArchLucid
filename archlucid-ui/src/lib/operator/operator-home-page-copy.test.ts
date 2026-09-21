import { describe, expect, it } from "vitest";

import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_WORKING_COMPLETED_PAGE_SUBTITLE,
  OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE,
  OPERATOR_HOME_WORKING_PAGE_SUBTITLE,
  operatorHomePageSubtitle,
} from "@/lib/operator/operator-home-page-copy";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";

const emptyMetrics: OperatorHomeWorkspaceMetricsSnapshot = {
  reviewPackagesTotal: 0,
  reviewPackagesCommitted: 0,
  reviewPackagesActive: 0,
  reviewPackagesAwaitingApproval: 0,
  openFindings: 0,
  governanceWarnings: 0,
  evidenceSources: 0,
  hasReviews: false,
};

describe("operator-home-page-copy", () => {
  it("uses start language on empty working Home instead of resume", () => {
    expect(OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE.toLowerCase()).not.toContain("resume");
    expect(OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE.toLowerCase()).not.toContain("already in progress");
    expect(operatorHomePageSubtitle(false, true)).toBe(OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE);
    expect(operatorHomePageSubtitle(false, true, emptyMetrics)).toBe(
      OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE,
    );
  });

  it("uses architecture-specific resume wording when reviews are in progress", () => {
    const activeMetrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 2,
      reviewPackagesActive: 2,
      hasReviews: true,
    };

    expect(OPERATOR_HOME_WORKING_PAGE_SUBTITLE).toContain("Resume architecture drafts");
    expect(operatorHomePageSubtitle(false, true, activeMetrics)).toBe(
      `${OPERATOR_HOME_WORKING_PAGE_SUBTITLE} · 2 active reviews`,
    );
  });

  it("uses open-completed wording when reviews exist but none are in progress", () => {
    const completedMetrics: OperatorHomeWorkspaceMetricsSnapshot = {
      ...emptyMetrics,
      reviewPackagesTotal: 1,
      reviewPackagesCommitted: 1,
      hasReviews: true,
    };

    expect(OPERATOR_HOME_WORKING_COMPLETED_PAGE_SUBTITLE.toLowerCase()).not.toContain("resume");
    expect(operatorHomePageSubtitle(false, true, completedMetrics)).toBe(
      OPERATOR_HOME_WORKING_COMPLETED_PAGE_SUBTITLE,
    );
  });

  it("omits buyer home subtitle when buyer-polished shell is enabled", () => {
    expect(operatorHomePageSubtitle(true)).toBeUndefined();
    expect(operatorHomePageSubtitle(false)).toBe(OPERATOR_HOME_PAGE_SUBTITLE);
    expect(operatorHomePageSubtitle(false, true)).not.toBe(OPERATOR_HOME_PAGE_SUBTITLE);
    expect(BUYER_OPERATOR_HOME_PAGE_SUBTITLE).not.toBe(OPERATOR_HOME_PAGE_SUBTITLE);
  });
});
