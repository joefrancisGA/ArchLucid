import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const pageDir = join(sectionsDir, "..");

const pageSource = readFileSync(join(pageDir, "page.tsx"), "utf8");
const pageViewSource = readFileSync(join(sectionsDir, "SponsorRoiDashboardPageView.tsx"), "utf8");
const deferredSource = readFileSync(
  join(sectionsDir, "sponsor-roi-dashboard-deferred-chunks.tsx"),
  "utf8",
);
const manifestLoaderSource = readFileSync(
  join(sectionsDir, "../../../../../lib/operator/load-deferred-chunk-from-manifest.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/operator/OperatorWelcomeOnboarding"',
  '@/components/sponsor/SponsorDashboardHowItWorks"',
  './SponsorDashboardNextActionSection"',
  './SponsorDashboardPrimaryMetricsSection"',
  './SponsorExportsSection"',
  './BusinessImpactSummaryWidget"',
  './SponsorRoiSummarySection"',
  './SponsorComplianceDriftTrendSection"',
  './SponsorRoiTrendSection"',
  './SponsorRoiEnvironmentSavingsSection"',
  './SponsorDashboardSupportingMetricsSection"',
] as const;

describe("sponsor dashboard deferred imports (TB-2061 / wave 10)", () => {
  it("keeps SponsorRoiDashboardPageView off the page static import graph", () => {
    expect(pageSource).not.toContain(
      'import { SponsorRoiDashboardPageView } from "./_sections/SponsorRoiDashboardPageView"',
    );
    expect(pageSource).toContain('import("./_sections/SponsorRoiDashboardPageView")');
    expect(pageSource).toContain("next/dynamic");
    expect(pageSource).toContain("sponsor-dashboard-chunk-loading");
  });

  it("keeps below-fold panels off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("sponsor-roi-dashboard-deferred-chunks");
    expect(pageViewSource).toContain("OperatorWelcomeOnboardingDeferred");
    expect(pageViewSource).toContain("SponsorDashboardHowItWorksDeferred");
    expect(pageViewSource).toContain("SponsorDashboardNextActionSectionDeferred");
    expect(pageViewSource).toContain("SponsorDashboardPrimaryMetricsSectionDeferred");
    expect(pageViewSource).toContain("SponsorExportsSectionDeferred");
    expect(pageViewSource).toContain("BusinessImpactSummaryWidgetDeferred");
    expect(pageViewSource).toContain("SponsorRoiSummarySectionDeferred");
    expect(pageViewSource).toContain("SponsorComplianceDriftTrendSectionDeferred");
    expect(pageViewSource).toContain("SponsorRoiTrendSectionDeferred");
    expect(pageViewSource).toContain("SponsorRoiEnvironmentSavingsSectionDeferred");
    expect(pageViewSource).toContain("SponsorDashboardSupportingMetricsSectionDeferred");
  });

  it("dynamic-imports manifest-backed sponsor dashboard panels via loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardNextActionSection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardPrimaryMetricsSection")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/sponsor/SponsorDashboardHowItWorks")');
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorExportsSection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/BusinessImpactSummaryWidget")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorComplianceDriftTrendSection")',
    );
    expect(deferredSource).toContain("sponsor-roi-dashboard-next-action");
    expect(deferredSource).toContain("sponsor-roi-dashboard-primary-metrics");
    expect(deferredSource).toContain("sponsor-roi-dashboard-how-it-works");
    expect(deferredSource).toContain("sponsor-roi-dashboard-exports");
    expect(deferredSource).toContain("sponsor-roi-dashboard-business-impact");
    expect(deferredSource).toContain("sponsor-roi-dashboard-roi-summary");
    expect(deferredSource).toContain("sponsor-roi-dashboard-compliance-drift-trend");
  });

  it("keeps remaining below-fold panels on inline dynamic imports", () => {
    expect(deferredSource).toContain("next/dynamic");
    expect(deferredSource).toContain('import("@/components/operator/OperatorWelcomeOnboarding")');
    expect(deferredSource).toContain('import("./SponsorRoiTrendSection")');
    expect(deferredSource).toContain('import("./SponsorRoiEnvironmentSavingsSection")');
    expect(deferredSource).toContain(
      'import("./SponsorDashboardSupportingMetricsSection")',
    );
    expect(deferredSource).toContain('import("@/components/SponsorWorkspaceHealthDashboard")');
  });
});
