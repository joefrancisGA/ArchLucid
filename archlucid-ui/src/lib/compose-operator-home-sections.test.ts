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
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: true,
      metrics: emptyMetrics,
    });

    expect(sections.map((section) => section.id)).toEqual([
      "unfinished",
      "hero",
      "recent-reviews",
      "buyer-chrome",
      "below-fold",
      "stickiness",
      "sponsor-roi",
    ]);
  });

  it("never mounts hero, stickiness, and unfinished as three equal above-fold spines in returning phase", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        draftCount: 0,
        hasCommittedManifest: true,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: true,
      metrics: { ...emptyMetrics, hasReviews: true, reviewPackagesCommitted: 1 },
    });

    const aboveFoldIds = sections.slice(0, 3).map((section) => section.id);

    expect(aboveFoldIds).toEqual(["unfinished", "hero", "recent-reviews"]);
    expect(sections.some((section) => section.id === "stickiness")).toBe(false);
  });

  it("orders operator shell sections with command center before recent reviews", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 2,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      metrics: { ...emptyMetrics, hasReviews: true, openFindings: 2 },
    });

    expect(sections.map((section) => section.id)).toContain("command-center");
    expect(sections.indexOf("command-center")).toBeLessThan(sections.indexOf("recent-reviews"));
  });
});
