import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { composeOperatorHomeSections } from "@/lib/compose-operator-home-sections";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "OperatorHomePageView.tsx"),
  "utf8",
);

const emptyHomeMetrics = {
  reviewPackagesTotal: 0,
  reviewPackagesCommitted: 0,
  reviewPackagesActive: 0,
  reviewPackagesAwaitingApproval: 0,
  openFindings: 0,
  governanceWarnings: 0,
  evidenceSources: 0,
  hasReviews: false,
};

describe("OperatorHomePageView progressive disclosure", () => {
  it("places workspace activity after hero and examples via state-aware placement", () => {
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
      metrics: emptyHomeMetrics,
    });

    const sectionIds = sections.map((section) => section.id);
    const heroIndex = sectionIds.indexOf("hero");
    const reviewsIndex = sectionIds.indexOf("recent-reviews");
    const belowFoldIndex = sectionIds.indexOf("below-fold");

    expect(heroIndex).toBeGreaterThan(-1);
    expect(reviewsIndex).toBeGreaterThan(heroIndex);
    expect(belowFoldIndex).toBeGreaterThan(reviewsIndex);

    expect(source).toContain("composeOperatorHomeSections");
    expect(source).toContain('case "hero"');
    expect(source).toContain("BuyerPolishedHomeHeroSectionDeferred");
    expect(source).toContain('case "recent-reviews"');
    expect(source).toContain('case "below-fold"');
    expect(source).toContain("OperatorHomeBelowFoldPanelsDeferred");
    expect(source).not.toContain("<OperatorHomeContinueSetupCard");
    expect(source).not.toContain("<OperatorHomeContinueSetupSlot");
    expect(source).not.toContain("<OperatorHomeSampleReviewPreview />");
    expect(source).not.toContain("OperatorHomeDemoOperations");
  });

  it("keeps workspace metrics behind default-closed disclosure below recent reviews", () => {
    const belowFoldSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "OperatorHomeBelowFoldPanels.tsx"),
      "utf8",
    );

    expect(belowFoldSource).toContain("OperatorHomeWorkspaceContextDisclosure");
    expect(source).not.toContain("<OperatorHomeDeltaPanel />");
    expect(source).not.toContain("<OperatorHomeWorkspaceStatusPanel />");

    const disclosureSource = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../components/operator-home/OperatorHomeWorkspaceContextDisclosure.tsx",
      ),
      "utf8",
    );

    expect(disclosureSource).toContain('data-testid="operator-home-workspace-context"');
    expect(disclosureSource).toContain("useNavCommittedArchitectureReview");
    expect(disclosureSource).toContain("useOperatorHomeBooleanDisclosureUrlSync");
    expect(disclosureSource).toContain("false");
    expect(disclosureSource).toContain('data-testid="operator-home-workspace-metrics-details-toggle"');
  });
});
