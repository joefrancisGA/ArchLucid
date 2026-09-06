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

    const aboveFoldIds = sections.slice(0, 5).map((section) => section.id);

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

  it("uses work queue spine for Working eval-empty (PT-10)", () => {
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
      workingMode: true,
      metrics: emptyMetrics,
    });

    expect(evalEmpty.map((section) => section.id)).toEqual([
      "in-flight",
      "unfinished",
      "start-something",
      "recent-reviews",
    ]);
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

  it("suppresses the promoted attention kind on the taxonomy strip", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        draftCount: 0,
        hasCommittedManifest: true,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      metrics: { ...emptyMetrics, hasReviews: true, reviewPackagesCommitted: 1 },
      promotedAttentionKind: "awaiting-approval",
    });

    const attention = sections.find((section) => section.id === "attention-taxonomy");

    expect(attention?.suppressAttentionKinds).toEqual(["unfinished-work", "awaiting-approval"]);
  });

  it("does not suppress the promoted attention kind when the metrics strip is omitted", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        draftCount: 0,
        hasCommittedManifest: false,
        openFindingsCount: 0,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      metrics: { ...emptyMetrics, hasReviews: true, reviewPackagesCommitted: 0 },
      promotedAttentionKind: "awaiting-approval",
    });

    const attention = sections.find((section) => section.id === "attention-taxonomy");

    expect(attention?.suppressAttentionKinds).toEqual(["unfinished-work"]);
  });

  it("prioritizes work queue sections in Working mode", () => {
    const sections = composeOperatorHomeSections({
      phaseSignals: {
        hasWorkspaceReviews: true,
        hasOverviewReviewRows: true,
        draftCount: 0,
        hasCommittedManifest: true,
        openFindingsCount: 2,
        governanceWarningsCount: 0,
      },
      buyerPolishedShell: false,
      workingMode: true,
      metrics: { ...emptyMetrics, hasReviews: true, openFindings: 2, reviewPackagesCommitted: 1 },
    });

    const sectionIds = sections.map((section) => section.id);

    expect(sectionIds.indexOf("in-flight")).toBeLessThan(sectionIds.indexOf("unfinished"));
    expect(sectionIds.indexOf("unfinished")).toBeLessThan(sectionIds.indexOf("start-something"));
    expect(sectionIds.indexOf("recent-reviews")).toBeLessThan(sectionIds.indexOf("start-something"));
    expect(sectionIds).not.toContain("below-fold");
    expect(sectionIds).not.toContain("sponsor-roi");
  });
});
