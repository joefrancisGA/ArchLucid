import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { architectureNestedComparePath } from "@/lib/architecture/architecture-routes";
import {
  resolveArchitectureDeskCompareBaseRunId,
  resolveArchitectureDeskCompareHref,
  SYSTEM_NOT_JOB_COMPARE_ENTRY_FROM_DESK_DOC_ANCHOR,
  SYSTEM_NOT_JOB_COMPARE_ENTRY_FROM_DESK_OWNER,
} from "@/lib/system-not-job-compare-entry-from-desk";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

const REPO_ROOT = join(process.cwd(), "..");
const architectureId = "architecture-identity-001";

const reviews: ArchitectureIdentityChildReviewSummary[] = [
  { runId: "review-newer", description: "Second review", createdUtc: "2026-01-02T00:00:00Z" },
  { runId: "review-older", description: "First review", createdUtc: "2026-01-01T00:00:00Z" },
];

describe("SN-027 compare entry from architecture desk", () => {
  it("prefers selected child, then latest review id, then newest child for base run", () => {
    expect(
      resolveArchitectureDeskCompareBaseRunId({
        reviews,
        latestReviewId: "review-older",
        selectedChildRunId: "review-newer",
      }),
    ).toBe("review-newer");
    expect(
      resolveArchitectureDeskCompareBaseRunId({
        reviews,
        latestReviewId: "review-older",
      }),
    ).toBe("review-older");
    expect(resolveArchitectureDeskCompareBaseRunId({ reviews })).toBe("review-newer");
  });

  it("Working mode opens nested compare with both sides when two reviews exist", () => {
    const resolution = resolveArchitectureDeskCompareHref({
      architectureId,
      reviews,
      workingMode: true,
    });

    expect(resolution).toEqual({
      kind: "href",
      href: `${architectureNestedComparePath(architectureId)}?leftRunId=review-older&rightRunId=review-newer`,
    });
  });

  it("Working mode pre-fills base only when a single sealed child exists", () => {
    const resolution = resolveArchitectureDeskCompareHref({
      architectureId,
      reviews: [reviews[0]!],
      latestReviewId: "review-newer",
      workingMode: true,
    });

    expect(resolution).toEqual({
      kind: "href",
      href: `${architectureNestedComparePath(architectureId)}?leftRunId=review-newer`,
    });
  });

  it("Guided mode keeps peer compare and disables when fewer than two reviews exist", () => {
    expect(
      resolveArchitectureDeskCompareHref({
        architectureId,
        reviews,
        workingMode: false,
      }),
    ).toEqual({
      kind: "href",
      href: "/insights/compare-two-reviews?priorRunId=review-older&laterRunId=review-newer&architectureId=architecture-identity-001",
    });
    expect(
      resolveArchitectureDeskCompareHref({
        architectureId,
        reviews: [reviews[0]!],
        workingMode: false,
      }).kind,
    ).toBe("disabled");
  });

  it("wires desk compare action and avoids empty peer compare in Working mode", () => {
    const compareAction = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskCompareAction.tsx"),
      "utf8",
    );

    expect(compareAction).toContain("resolveArchitectureDeskCompareHref");
    expect(compareAction).toContain("latestReviewId");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_COMPARE_ENTRY_FROM_DESK_DOC_ANCHOR))).toBe(true);
    expect(SYSTEM_NOT_JOB_COMPARE_ENTRY_FROM_DESK_OWNER).toBe("SN-027");
  });
});
