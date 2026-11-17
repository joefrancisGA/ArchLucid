import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { composeOperatorHomeSections } from "@/lib/compose-operator-home-sections";

const sectionDir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(sectionDir, "OperatorHomePageView.tsx"), "utf8");

describe("OperatorHomePageView progressive disclosure", () => {
  it("places workspace activity after hero via composeOperatorHomeSections ordering", () => {
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
      metrics: {
        reviewPackagesTotal: 0,
        reviewPackagesCommitted: 0,
        reviewPackagesActive: 0,
        reviewPackagesAwaitingApproval: 0,
        openFindings: 0,
        governanceWarnings: 0,
        evidenceSources: 0,
        hasReviews: false,
      },
      workingMode: false,
    });

    const ids = sections.map((section) => section.id);

    expect(ids.indexOf("hero")).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf("recent-reviews")).toBeGreaterThan(ids.indexOf("hero"));
    expect(ids.indexOf("below-fold")).toBeGreaterThan(ids.indexOf("recent-reviews"));
    expect(source).toContain("composeOperatorHomeSections");
    expect(source).not.toContain("<OperatorHomeContinueSetupCard");
    expect(source).not.toContain("<OperatorHomeContinueSetupSlot");
    expect(source).not.toContain("<OperatorHomeSampleReviewPreview />");
    expect(source).not.toContain("OperatorHomeDemoOperations");
  });

  it("keeps workspace metrics behind default-closed disclosure below recent reviews", () => {
    const belowFoldSource = readFileSync(join(sectionDir, "OperatorHomeBelowFoldPanels.tsx"), "utf8");

    expect(belowFoldSource).toContain("OperatorHomeWorkspaceContextDisclosure");
    expect(source).not.toContain("<OperatorHomeDeltaPanel />");
    expect(source).not.toContain("<OperatorHomeWorkspaceStatusPanel />");

    const disclosureSource = readFileSync(
      join(sectionDir, "../../../components/operator-home/OperatorHomeWorkspaceContextDisclosure.tsx"),
      "utf8",
    );

    expect(disclosureSource).toContain('data-testid="operator-home-workspace-context"');
    expect(disclosureSource).toContain("useNavCommittedArchitectureReview");
    expect(disclosureSource).toContain("useOperatorHomeBooleanDisclosureUrlSync");
    expect(disclosureSource).toContain('data-testid="operator-home-workspace-metrics-details-toggle"');
  });
});
