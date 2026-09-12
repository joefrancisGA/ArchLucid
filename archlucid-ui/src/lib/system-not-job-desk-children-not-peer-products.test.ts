import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  architectureNestedComparePath,
} from "@/lib/architecture/architecture-routes";
import {
  resolveSystemNotJobWorkingDeskCompareHref,
  SYSTEM_NOT_JOB_DESK_CHILD_LIST_SURFACES,
  SYSTEM_NOT_JOB_DESK_CHILDREN_DOC_ANCHOR,
  SYSTEM_NOT_JOB_DESK_CHILDREN_OWNER,
  SYSTEM_NOT_JOB_DESK_PEER_INSIGHTS_CTA_ROWS,
} from "@/lib/system-not-job-desk-children-not-peer-products";

const repoRoot = join(__dirname, "..", "..", "..");

describe("SN-017 desk children not peer products", () => {
  const architectureId = "architecture-identity-001";

  it("names ADR 0079 anchor and owner", () => {
    expect(SYSTEM_NOT_JOB_DESK_CHILDREN_OWNER).toBe("SN-017");
    expect(SYSTEM_NOT_JOB_DESK_CHILDREN_DOC_ANCHOR).toContain("0079");
  });

  it("nests Working desk Compare under the architecture", () => {
    expect(
      resolveSystemNotJobWorkingDeskCompareHref({
        architectureId,
        priorRunId: "review-older",
        laterRunId: "review-newer",
        workingMode: true,
      }),
    ).toBe(
      `${architectureNestedComparePath(architectureId)}?leftRunId=review-older&rightRunId=review-newer`,
    );
    expect(
      resolveSystemNotJobWorkingDeskCompareHref({
        architectureId,
        priorRunId: "review-older",
        laterRunId: "review-newer",
        workingMode: true,
      }),
    ).not.toContain("/insights/compare-two-reviews");
  });

  it("keeps Guided desk Compare on peer Insights", () => {
    expect(
      resolveSystemNotJobWorkingDeskCompareHref({
        architectureId,
        priorRunId: "review-older",
        laterRunId: "review-newer",
        workingMode: false,
      }),
    ).toBe(
      "/insights/compare-two-reviews?priorRunId=review-older&laterRunId=review-newer&architectureId=architecture-identity-001",
    );
  });

  it.each(SYSTEM_NOT_JOB_DESK_CHILD_LIST_SURFACES.map((row) => [row.relativePath, row.surface] as const))(
    "%s lists child %s on the architecture desk",
    (relativePath) => {
      const content = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(content.length).toBeGreaterThan(0);
    },
  );

  it.each(SYSTEM_NOT_JOB_DESK_PEER_INSIGHTS_CTA_ROWS.map((row) => [row.relativePath, row.surface] as const))(
    "%s uses resolveArchitectureDeskCompareHref for %s",
    (relativePath) => {
      const content = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(content).toContain("resolveArchitectureDeskCompareHref");
      expect(content).not.toMatch(/compareTwoReviewsHref\s*\(/);
    },
  );
});
