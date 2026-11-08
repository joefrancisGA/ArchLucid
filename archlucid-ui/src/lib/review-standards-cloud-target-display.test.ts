import { describe, expect, it } from "vitest";

import {
  COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN,
  COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_STORED,
  COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_STORED_EMPTY,
  formatCommittedReviewStandardsCloudTarget,
} from "@/lib/review-standards-cloud-target-display";

describe("formatCommittedReviewStandardsCloudTarget", () => {
  it("labels omitted, empty, None, and stored hyperscaler targets", () => {
    expect(formatCommittedReviewStandardsCloudTarget(undefined)).toBe(
      COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_STORED,
    );
    expect(formatCommittedReviewStandardsCloudTarget(null)).toBe(
      COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_STORED,
    );
    expect(formatCommittedReviewStandardsCloudTarget("")).toBe(
      COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_STORED_EMPTY,
    );
    expect(formatCommittedReviewStandardsCloudTarget("  ")).toBe(
      COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_STORED_EMPTY,
    );
    expect(formatCommittedReviewStandardsCloudTarget("None")).toBe(
      COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN,
    );
    expect(formatCommittedReviewStandardsCloudTarget(" none ")).toBe(
      COMMITTED_REVIEW_STANDARDS_CLOUD_TARGET_NOT_CHOSEN,
    );
    expect(formatCommittedReviewStandardsCloudTarget("Azure")).toBe("Azure");
  });
});
