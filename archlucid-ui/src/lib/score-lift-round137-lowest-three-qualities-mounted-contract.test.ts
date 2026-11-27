import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round137 lowest-three-qualities mounted contract", () => {
  it("accelerator home and admin pages mount second capture strip", () => {
    const home = readUiSource("components/product-line/SecureNowAcceleratorHomeSection.tsx");
    const index = readUiSource("app/(operator)/administration/securenow-accelerator-index/SecureNowAcceleratorIndexPageView.tsx");
    const walks = readUiSource("app/(operator)/administration/securenow-scenario-walks/SecureNowScenarioWalksPageView.tsx");

    expect(home).toContain("SECURENOW_ACCELERATOR_HOME_QUICK_ROWS");
    expect(index).toContain("SecureNowAdminSecondCapturePathDeltaStrip");
    expect(walks).toContain("SecureNowAdminSecondCapturePathDeltaStrip");
  });

  it("review spine uses cognitive primary action", () => {
    const spine = readUiSource("components/reviews/RunDetailFirstReviewSpineBand.tsx");

    expect(spine).toContain("resolveReviewCognitiveLoadPrimaryAction");
    expect(spine).toContain("primaryAction={cognitivePrimaryAction}");
  });
});
