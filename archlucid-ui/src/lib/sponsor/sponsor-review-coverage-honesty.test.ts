import { describe, expect, it } from "vitest";

import {
  formatSponsorReviewCoverageHonestyMarkdown,
  sponsorReviewCoverageHonestyApplies,
} from "@/lib/sponsor/sponsor-review-coverage-honesty";

describe("sponsor-review-coverage-honesty (WA-08)", () => {
  it("applies when skipped MUST questions are present", () => {
    const applies = sponsorReviewCoverageHonestyApplies({
      runId: "run-abc",
      progressSummary: {
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      },
      manifestSummary: {
        feasibilityVerdict: {
          kind: "Feasible",
          transparencyTrail: {
            asserted: [],
            inferred: [],
            skipped: [{ questionKey: "data-residency", tier: "Must" }],
          },
        },
      } as never,
      graphSnapshot: { nodes: [{ nodeType: "Actor" }] },
    });

    expect(applies).toBe(true);
  });

  it("includes architecture package honesty in exported markdown", () => {
    const markdown = formatSponsorReviewCoverageHonestyMarkdown({
      runId: "run-abc",
      progressSummary: {
        hasContextSnapshot: true,
        hasGraphSnapshot: true,
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
      },
      manifestSummary: {
        feasibilityVerdict: {
          kind: "Feasible",
          transparencyTrail: {
            asserted: [],
            inferred: [],
            skipped: [{ questionKey: "data-residency", tier: "Must" }],
          },
        },
      } as never,
      graphSnapshot: { nodes: [{ nodeType: "Actor" }] },
    });

    expect(markdown).toContain("Architecture package honesty");
    expect(markdown).toContain("not** an all-clear");
    expect(markdown).toContain("data-residency");
  });
});
