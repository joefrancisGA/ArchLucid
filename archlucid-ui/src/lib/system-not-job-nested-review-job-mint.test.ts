import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveSystemNotJobWorkingReviewArchitectureId,
  resolveSystemNotJobWorkingReviewOpenHref,
  SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_DOC_ANCHOR,
  SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_ROWS,
  SYSTEM_NOT_JOB_UNLINKED_REVIEW_PEER_HONESTY,
} from "@/lib/system-not-job-nested-review-job-mint";

const repoRoot = join(__dirname, "..", "..", "..");
const uiSrcRoot = join(__dirname, "..");

describe("SN-010 nested review job vs desk mint shrink", () => {
  it("nests review href when architecture id is known", () => {
    expect(
      resolveSystemNotJobWorkingReviewOpenHref("run-42", "architecture-identity-001"),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-42");
    expect(
      resolveSystemNotJobWorkingReviewOpenHref("run-42", "architecture-identity-001"),
    ).not.toBe("/architecture/reviews/run-42");
  });

  it("keeps honest peer href when architecture id is unknown", () => {
    expect(resolveSystemNotJobWorkingReviewOpenHref("run-unlinked", null)).toBe(
      "/architecture/reviews/run-unlinked",
    );
    expect(SYSTEM_NOT_JOB_UNLINKED_REVIEW_PEER_HONESTY).toContain("peer");
  });

  it("resolves architecture id from pinned, nested route, then query", () => {
    expect(
      resolveSystemNotJobWorkingReviewArchitectureId({
        pinnedArchitectureId: "arch-pinned",
        pathname: "/architecture/architectures/arch-route/impact-preview",
        queryArchitectureId: "arch-query",
      }),
    ).toBe("arch-pinned");

    expect(
      resolveSystemNotJobWorkingReviewArchitectureId({
        pathname: "/architecture/architectures/arch-route/impact-preview",
        queryArchitectureId: "arch-query",
      }),
    ).toBe("arch-route");

    expect(
      resolveSystemNotJobWorkingReviewArchitectureId({
        pathname: "/insights/evidence-graph",
        queryArchitectureId: "arch-query",
      }),
    ).toBe("arch-query");
  });

  it.each(SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_ROWS.map((row) => [row.relativePath, row.surface] as const))(
    "%s uses resolveSystemNotJobWorkingReviewOpenHref for %s",
    (relativePath) => {
      const fromRepoRoot = join(repoRoot, relativePath);
      const fromUiSrc = join(uiSrcRoot, relativePath.replace(/^archlucid-ui\/src\//, ""));
      const source = readFileSync(fromRepoRoot, "utf8");

      expect(source).toContain("resolveSystemNotJobWorkingReviewOpenHref");
      expect(readFileSync(fromUiSrc, "utf8")).toContain("resolveSystemNotJobWorkingReviewOpenHref");
    },
  );

  it("points at peer mint inventory for leftover shrink context", () => {
    const inventory = readFileSync(join(repoRoot, SYSTEM_NOT_JOB_NESTED_REVIEW_JOB_MINT_DOC_ANCHOR), "utf8");

    expect(inventory).toContain("reviewDetailPath");
    expect(inventory).toContain("Remaining honest fallbacks");
  });
});
