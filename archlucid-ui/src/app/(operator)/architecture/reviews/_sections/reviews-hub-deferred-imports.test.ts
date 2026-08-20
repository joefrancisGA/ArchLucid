import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));

const pageViewSource = readFileSync(join(sectionsDir, "RunsPageView.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "reviews-hub-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readFileSync(
  join(sectionsDir, "../../../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/operator/OperatorWelcomeOnboarding"',
  './ReviewsHubExploreSamples"',
  './ReviewsHubPackageIncludes"',
  './ReviewsHubBeforeAfterDeltaPanel"',
  '@/components/runs/RunsIndexBeforeAfterPanel"',
  '@/components/runs/RunsListAggregateErrorBoundary"',
] as const;

describe("reviews hub deferred imports (TB-934)", () => {
  it("keeps below-fold panels off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("reviews-hub-deferred-chunks");
    expect(pageViewSource).toContain("OperatorWelcomeOnboardingDeferred");
    expect(pageViewSource).toContain("ReviewsHubExploreSamplesDeferred");
    expect(pageViewSource).toContain("ReviewsHubPackageIncludesDeferred");
    expect(pageViewSource).toContain("ReviewsHubBeforeAfterDeltaPanelDeferred");
    expect(pageViewSource).toContain("RunsIndexBeforeAfterPanelDeferred");
    expect(pageViewSource).toContain("RunsListAggregateErrorBoundaryDeferred");
  });

  it("dynamic-imports deferred reviews hub panels via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/operator/OperatorWelcomeOnboarding")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubExploreSamples")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubPackageIncludes")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/reviews/_sections/ReviewsHubBeforeAfterDeltaPanel")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunsIndexBeforeAfterPanel")');
    expect(manifestLoaderSource).toContain('import("@/components/runs/RunsListAggregateErrorBoundary")');
  });
});
