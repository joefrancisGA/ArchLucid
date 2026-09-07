import { describe, expect, it } from "vitest";

import {
  resolveWorkingBackHrefTarget,
  resolveWorkingFindingDetailHref,
  resolveWorkingFindingEvidenceTraceHref,
  resolveWorkingPrintBackHref,
  resolveWorkingReviewJobBackHref,
} from "@/lib/architecture/working-back-href";

describe("working back href (AO-44)", () => {
  const architectureId = "architecture-identity-001";
  const reviewId = "run-nested-1";
  const findingId = "finding-9";

  it("returns nested review job and architecture desk when parent id is known", () => {
    const target = resolveWorkingBackHrefTarget(reviewId, architectureId);

    expect(target.reviewJobHref).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-nested-1",
    );
    expect(target.architectureDeskHref).toBe("/architecture/architectures/architecture-identity-001");
  });

  it("keeps peer review URLs for unlinked jobs", () => {
    const target = resolveWorkingBackHrefTarget("run-unlinked", null);

    expect(target.reviewJobHref).toBe("/architecture/reviews/run-unlinked");
    expect(target.architectureDeskHref).toBeNull();
  });

  it("routes print back to nested review package tab", () => {
    expect(resolveWorkingPrintBackHref(reviewId, architectureId)).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-nested-1?reviewTab=review-package",
    );
  });

  it("routes provenance-style review back with optional tab", () => {
    expect(resolveWorkingReviewJobBackHref(reviewId, architectureId, "review-package")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-nested-1?reviewTab=review-package",
    );
  });

  it("routes finding detail and evidence trace under nested review paths", () => {
    expect(resolveWorkingFindingDetailHref(reviewId, findingId, architectureId)).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-nested-1/findings/finding-9",
    );
    expect(resolveWorkingFindingEvidenceTraceHref(reviewId, findingId, architectureId)).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-nested-1/findings/finding-9/evidence-trace",
    );
  });

  it("preserves findings queue run id on nested finding links", () => {
    expect(
      resolveWorkingFindingEvidenceTraceHref(reviewId, findingId, architectureId, "queue-run-1"),
    ).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-nested-1/findings/finding-9/evidence-trace?runId=queue-run-1",
    );
  });
});
