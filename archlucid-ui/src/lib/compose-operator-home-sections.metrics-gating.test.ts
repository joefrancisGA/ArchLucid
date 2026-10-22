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

describe("composeOperatorHomeSections metrics gating (daily-driver)", () => {
  it("hides metrics strip until at least one finalized review exists", () => {
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

    expect(sections.map((section) => section.id)).not.toContain("metrics-strip");
  });
});
