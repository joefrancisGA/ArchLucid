import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));

const pageViewSource = readFileSync(join(sectionsDir, "RunsPageView.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "reviews-hub-deferred-chunks.tsx"), "utf8");

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

  it("dynamic-imports each deferred reviews hub panel", () => {
    expect(deferredSource).toContain('import("@/components/operator/OperatorWelcomeOnboarding")');
    expect(deferredSource).toContain('import("./ReviewsHubExploreSamples")');
    expect(deferredSource).toContain('import("./ReviewsHubPackageIncludes")');
    expect(deferredSource).toContain('import("./ReviewsHubBeforeAfterDeltaPanel")');
    expect(deferredSource).toContain('import("@/components/runs/RunsIndexBeforeAfterPanel")');
    expect(deferredSource).toContain('import("@/components/runs/RunsListAggregateErrorBoundary")');
    expect(deferredSource).toContain("next/dynamic");
  });
});
