import { describe, expect, it } from "vitest";

import { composeOperatorHomeSections } from "@/lib/compose-operator-home-sections";

const emptyMetrics = {
  reviewPackagesTotal: 0,
  reviewPackagesCommitted: 0,
  reviewPackagesActive: 0,
  openFindings: 0,
  governanceWarnings: 0,
  evidenceSources: 0,
  hasReviews: false,
};

describe("composeOperatorHomeSections (TB-2368)", () => {
  it("orders buyer-polished sections with hero before recent reviews", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: false,
        hasOverviewReviewRows: false,
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: true,
      metrics: emptyMetrics,
    });

    expect(sections.map((section) => section.id)).toEqual([
      "hero",
      "recent-reviews",
      "below-fold",
      "sponsor-roi",
    ]);
  });

  it("never mounts hero, stickiness, and unfinished as three equal above-fold spines in returning phase", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        draftCount: 0,
        hasCommittedManifest: true,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: true,
      metrics: { ...emptyMetrics, hasReviews: true, reviewPackagesCommitted: 1 },
    });

    const aboveFoldIds = sections.slice(0, 5).map((section) => section.id);

    expect(aboveFoldIds).toEqual([
      "recommended-next",
      "metrics-strip",
      "unfinished",
      "start-something",
      "recent-reviews",
    ]);
    expect(sections.some((section) => section.id === "stickiness")).toBe(false);
    expect(sections.some((section) => section.id === "buyer-chrome")).toBe(true);
  });

  it("orders operator shell sections with recommended next before recent reviews when workspace has activity", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 2,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      metrics: { ...emptyMetrics, hasReviews: true, openFindings: 2 },
    });

    const sectionIds = sections.map((section) => section.id);

    expect(sectionIds).toContain("recommended-next");
    expect(sectionIds.indexOf("recommended-next")).toBeLessThan(sectionIds.indexOf("recent-reviews"));
  });
});
