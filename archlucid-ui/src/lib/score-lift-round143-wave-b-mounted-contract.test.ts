import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round143 wave B mounted contract", () => {
  it("stickiness strips, filters, starter packs, and cross-links", () => {
    const home = readUiSource("components/product-line/SecureNowAcceleratorHomeSection.tsx");
    expect(home).toContain("SecureNowAcceleratorResumeStrip");
    expect(home).toContain("SecureNowAcceleratorStarterPacksSection");

    const index = readUiSource("app/(operator)/administration/securenow-accelerator-index/SecureNowAcceleratorIndexPageView.tsx");
    expect(index).toContain("SecureNowAcceleratorCatalogFilterChips");

    const firstHour = readUiSource("app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx");
    expect(firstHour).toContain("SecureNowAdminSecondCapturePathDeltaStrip");

    const walks = readUiSource("app/(operator)/administration/securenow-scenario-walks/SecureNowScenarioWalksPageView.tsx");
    expect(walks).toContain("SecureNowAcceleratorScenarioRelatedRail");
  });
});
