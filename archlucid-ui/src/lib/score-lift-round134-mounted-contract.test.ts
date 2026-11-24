import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round134 mounted contract", () => {
  it("accelerators: first review, golden walkthrough, pilot spine catalog", () => {
    const progress = readUiSource(
      "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideProgressSummary.tsx",
    );
    const walkthrough = readUiSource(
      "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideWalkthrough.tsx",
    );
    const golden = readUiSource("components/golden-walkthrough/GoldenSponsorPackageWalkthroughPanel.tsx");
    const pilotSpine = readUiSource("app/(operator)/administration/securenow-pilot-spine/SecureNowPilotSpinePageView.tsx");

    expect(progress).toContain('data-testid="first-review-guide-progress-load-failure"');
    expect(progress).toContain("FIRST_REVIEW_GUIDE_PROGRESS_LOAD_FAILURE_LINE");

    const loadAt = walkthrough.indexOf('data-testid="first-review-guide-walkthrough-load-failure"');
    const emptyAt = walkthrough.indexOf('data-testid="first-review-guide-walkthrough-empty-not-load-failure"');
    expect(loadAt).toBeGreaterThan(-1);
    expect(emptyAt).toBeGreaterThan(loadAt);
    expect(walkthrough).toContain("if (steps.length === 0)");
    expect(walkthrough).toContain("SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH");

    expect(golden).toContain("GoldenSponsorPackageWalkthroughTenantCollectionStrip");
    const tenantStrip = readUiSource("components/golden-walkthrough/GoldenSponsorPackageWalkthroughTenantCollectionStrip.tsx");
    expect(tenantStrip).toContain('data-testid="golden-sponsor-package-walkthrough-tenant-collection"');

    expect(pilotSpine).toContain("SecureNowPilotSpineAcceleratorIndex");
    const pilotIndex = readUiSource("components/product-line/SecureNowPilotSpineAcceleratorIndex.tsx");
    expect(pilotIndex).toContain('data-testid="securenow-pilot-spine-accelerator-index"');
  });
});
