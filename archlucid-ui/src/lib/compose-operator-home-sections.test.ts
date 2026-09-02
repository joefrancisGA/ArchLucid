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
  it("orders buyer-polished sections with hero only for eval-empty", () => {
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

    expect(sections.map((section) => section.id)).toEqual(["hero"]);
  });

  it("keeps recent reviews for eval-with-drafts buyer-polished shell", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: false,
        hasOverviewReviewRows: false,
        draftCount: 1,
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

    const aboveFoldIds = sections.slice(0, 6).map((section) => section.id);

    expect(aboveFoldIds).toEqual([
      "metrics-strip",
      "attention-taxonomy",
      "unfinished",
      "start-something",
      "recent-reviews",
    ]);
    expect(sections.some((section) => section.id === "stickiness")).toBe(false);
    expect(sections.some((section) => section.id === "buyer-chrome")).toBe(true);
  });

  it("uses hero-only spine for operator shell eval-empty", () => {
    const evalEmpty = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: false,
        hasOverviewReviewRows: false,
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      metrics: emptyMetrics,
    });

    expect(evalEmpty.map((section) => section.id)).toEqual(["hero"]);
  });

  it("uses hero spine for operator shell eval-with-drafts (first-viewport budget)", () => {
    const evalWithDrafts = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: false,
        hasOverviewReviewRows: false,
        draftCount: 1,
        hasCommittedManifest: false,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      metrics: emptyMetrics,
    });

    expect(evalWithDrafts.map((section) => section.id)).toEqual([
      "hero",
      "recent-reviews",
      "below-fold",
      "sponsor-roi",
    ]);
  });

  it("orders operator shell sections with attention taxonomy before recent reviews when workspace has activity", () => {
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

    expect(sectionIds).toContain("attention-taxonomy");
    expect(sectionIds.indexOf("attention-taxonomy")).toBeLessThan(sectionIds.indexOf("recent-reviews"));
    expect(sectionIds).not.toContain("recommended-next");
  });
});
