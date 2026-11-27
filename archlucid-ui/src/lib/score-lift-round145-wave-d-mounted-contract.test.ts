import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round145 wave D mounted contract", () => {
  it("pinned paths strip, index quick strip, template grid footer", () => {
    const index = readUiSource("app/(operator)/administration/securenow-accelerator-index/SecureNowAcceleratorIndexPageView.tsx");
    expect(index).toContain("SecureNowAcceleratorPinnedPathsStrip");
    expect(index).toContain("SecureNowAcceleratorPinnedQuickStrip");

    const walks = readUiSource("app/(operator)/administration/securenow-scenario-walks/SecureNowScenarioWalksPageView.tsx");
    expect(walks).toContain("SecureNowAcceleratorPinnedPathsStrip");
    expect(walks).toContain("SecureNowAcceleratorFamilyProgressStrip");

    const templates = readUiSource("app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesClient.tsx");
    expect(templates).toContain("HelpSpecialtyWalkthroughTemplateGridFooter");
  });
});
