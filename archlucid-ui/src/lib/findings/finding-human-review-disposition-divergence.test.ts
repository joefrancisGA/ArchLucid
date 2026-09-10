import { describe, expect, it } from "vitest";

import {
  FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_EXPORT_SUFFIX,
  formatHumanReviewStatusForExportWithDivergenceHonesty,
  resolveFindingHumanReviewDispositionDivergence,
  resolveFindingHumanReviewDispositionDivergenceWithPointer,
} from "./finding-human-review-disposition-divergence";

describe("finding-human-review-disposition-divergence (LP-17)", () => {
  it("flags approved ITSM queue state when current disposition is deferred", () => {
    const result = resolveFindingHumanReviewDispositionDivergence({
      humanReviewStatus: "Approved",
      latestDisposition: "Deferred",
      latestDispositionRowVersionBase64: "pointer-token",
    });

    expect(result.isDiverged).toBe(true);
    expect(result.reason).toContain("approved");
    expect(result.reason).toContain("Deferred");
  });

  it("does not flag when disposition matches approved terminal states", () => {
    const result = resolveFindingHumanReviewDispositionDivergence({
      humanReviewStatus: 2,
      latestDisposition: "Remediated",
      latestDispositionRowVersionBase64: "pointer-token",
    });

    expect(result.isDiverged).toBe(false);
  });

  it("requires a current pointer before flagging divergence", () => {
    const result = resolveFindingHumanReviewDispositionDivergenceWithPointer(
      "Approved",
      "Deferred",
      false,
    );

    expect(result.isDiverged).toBe(false);
  });

  it("appends export honesty suffix when diverged", () => {
    const formatted = formatHumanReviewStatusForExportWithDivergenceHonesty("Approved", {
      isDiverged: true,
      reason: "diverged",
    });

    expect(formatted).toBe(`Approved${FINDING_HUMAN_REVIEW_DISPOSITION_DIVERGENCE_EXPORT_SUFFIX}`);
  });
});
