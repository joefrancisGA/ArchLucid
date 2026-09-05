import { describe, expect, it } from "vitest";

import { readRegisteredSource, readRunDetailPageViewFamilySource } from "@/testing/source-scan-harness";

const pageViewSource = readRunDetailPageViewFamilySource();
const createHomeSource = readRegisteredSource("run-detail-page-view-create-home");

describe("RunDetailPageView create-home governance (TB-1858)", () => {
  it("hides sponsor share and work-item panels until the package is committed", () => {
    const governancePanelIndex = createHomeSource.indexOf("governance: (");
    const governancePanelSource = createHomeSource.slice(governancePanelIndex, governancePanelIndex + 2_500);

    expect(governancePanelSource).toContain("{m.manifestId ? (");
    expect(governancePanelSource).toContain("<RunDetailArchitectureCreateWorkItemSectionDeferred");
    expect(governancePanelSource).toContain("<RunDetailArchitectureSponsorSharingPanelDeferred");
    expect(governancePanelSource).toContain("pagePrimaryOwnedElsewhere");
    expect(governancePanelSource).not.toMatch(
      /<RunDetailArchitectureCreateWorkItemSectionDeferred[\s\S]*?<\/>\s*<RunDetailArchitectureSponsorSharingPanelDeferred/,
    );
  });

  it("passes pagePrimaryOwnedElsewhere to create-home activity outcome cards", () => {
    const outcomeCardsIndex = pageViewSource.indexOf("const createHomeActivityOutcomeCardsEl = (");
    const outcomeCardsSource = pageViewSource.slice(outcomeCardsIndex, outcomeCardsIndex + 2_400);

    expect(outcomeCardsSource).toContain("pagePrimaryOwnedElsewhere");
  });
});
