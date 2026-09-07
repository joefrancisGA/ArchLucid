import { describe, expect, it } from "vitest";

import { workingShareHref, WORKING_SHARE_UNLINKED_JOB_TOAST } from "@/lib/architecture/working-share-href";

describe("workingShareHref (AO-09)", () => {
  it("prefers nested review path when architecture id is known", () => {
    const result = workingShareHref({
      architectureId: "architecture-identity-001",
      reviewId: "run-001",
      search: { reviewTab: "findings" },
    });

    expect(result.isUnlinkedJob).toBe(false);
    expect(result.href).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-001?reviewTab=findings",
    );
    expect(result.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
  });

  it("falls back to peer review URL when architecture id is unknown", () => {
    const result = workingShareHref({
      reviewId: "run-unlinked",
    });

    expect(result.isUnlinkedJob).toBe(true);
    expect(result.href).toBe("/architecture/reviews/run-unlinked");
    expect(WORKING_SHARE_UNLINKED_JOB_TOAST.toLowerCase()).toContain("not linked");
  });

  it("copies architecture desk when only architecture id is provided", () => {
    const result = workingShareHref({
      architectureId: "architecture-identity-001",
    });

    expect(result.href).toBe("/architecture/architectures/architecture-identity-001");
    expect(result.isUnlinkedJob).toBe(false);
  });
});
