import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  architectureNestedComparePath,
  architectureNestedReviewPath,
} from "@/lib/architecture/architecture-routes";
import {
  resolveSystemNotJobDeskSealedChildCompareHref,
  resolveSystemNotJobDeskSealedChildReviewHref,
  SYSTEM_NOT_JOB_DESK_SEALED_CHILD_LINK_ROWS,
  SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID,
  SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL,
  SYSTEM_NOT_JOB_SEALED_CHILD_BACK_SURFACES,
  SYSTEM_NOT_JOB_SEALED_CHILD_DOC_ANCHOR,
  SYSTEM_NOT_JOB_SEALED_CHILD_OWNER,
} from "@/lib/system-not-job-sealed-child-not-second-desk";

const repoRoot = join(__dirname, "..", "..", "..");

describe("SN-018 sealed child not second desk", () => {
  const architectureId = "architecture-identity-001";
  const reviewId = "review-sealed-1";

  it("names ADR 0077 anchor and owner", () => {
    expect(SYSTEM_NOT_JOB_SEALED_CHILD_OWNER).toBe("SN-018");
    expect(SYSTEM_NOT_JOB_SEALED_CHILD_DOC_ANCHOR).toContain("0077");
    expect(SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL).toBe("Back to architecture desk");
    expect(SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID).toBe(
      "working-nested-back-to-architecture-desk",
    );
  });

  it("nests desk sealed-child review href under the architecture", () => {
    expect(resolveSystemNotJobDeskSealedChildReviewHref(reviewId, architectureId)).toBe(
      architectureNestedReviewPath(architectureId, reviewId),
    );
    expect(resolveSystemNotJobDeskSealedChildReviewHref(reviewId, architectureId)).not.toContain(
      "/architecture/reviews/",
    );
  });

  it("nests Working seal-delta compare under the architecture desk", () => {
    expect(
      resolveSystemNotJobDeskSealedChildCompareHref({
        architectureId,
        priorRunId: "review-older",
        laterRunId: "review-newer",
        workingMode: true,
      }),
    ).toBe(
      `${architectureNestedComparePath(architectureId)}?leftRunId=review-older&rightRunId=review-newer`,
    );
  });

  it("keeps Guided seal-delta compare on peer Insights", () => {
    expect(
      resolveSystemNotJobDeskSealedChildCompareHref({
        architectureId,
        priorRunId: "review-older",
        laterRunId: "review-newer",
        workingMode: false,
      }),
    ).toBe(
      "/insights/compare-two-reviews?priorRunId=review-older&laterRunId=review-newer&architectureId=architecture-identity-001",
    );
  });

  it.each(SYSTEM_NOT_JOB_DESK_SEALED_CHILD_LINK_ROWS.map((row) => [row.relativePath, row.surface] as const))(
    "%s uses sealed-child desk resolvers for %s",
    (relativePath) => {
      const content = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(content).toMatch(
        /resolveSystemNotJobDeskSealedChildReviewHref|resolveSystemNotJobDeskSealedChildCompareHref/,
      );
    },
  );

  it.each(SYSTEM_NOT_JOB_SEALED_CHILD_BACK_SURFACES.map((row) => [row.relativePath, row.surface] as const))(
    "%s exposes back-to-desk chrome for %s",
    (relativePath) => {
      const content = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(content).toContain("SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID");
      expect(content).toContain("SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL");
    },
  );
});
