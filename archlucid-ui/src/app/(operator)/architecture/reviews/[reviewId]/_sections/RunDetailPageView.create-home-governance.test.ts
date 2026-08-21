import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

describe("RunDetailPageView create-home governance (TB-1858)", () => {
  it("hides sponsor share and work-item panels until the package is committed", () => {
    const governancePanelIndex = source.indexOf("governance: (");
    const governancePanelSource = source.slice(governancePanelIndex, governancePanelIndex + 2_500);

    expect(governancePanelSource).toContain("{m.manifestId ? (");
    expect(governancePanelSource).toContain("<RunDetailArchitectureCreateWorkItemSectionDeferred");
    expect(governancePanelSource).toContain("<RunDetailArchitectureSponsorSharingPanelDeferred");
    expect(governancePanelSource).toContain("pagePrimaryOwnedElsewhere");
    expect(governancePanelSource).not.toMatch(
      /<RunDetailArchitectureCreateWorkItemSectionDeferred[\s\S]*?<\/>\s*<RunDetailArchitectureSponsorSharingPanelDeferred/,
    );
  });
});
