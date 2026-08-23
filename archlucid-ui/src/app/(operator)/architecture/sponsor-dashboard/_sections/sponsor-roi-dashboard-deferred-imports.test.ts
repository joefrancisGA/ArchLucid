import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const pageDir = join(sectionsDir, "..");

const pageSource = readFileSync(join(pageDir, "page.tsx"), "utf8");
const pageViewSource = readFileSync(join(sectionsDir, "SponsorRoiDashboardPageView.tsx"), "utf8");
const deferredSource = readFileSync(
  join(sectionsDir, "sponsor-roi-dashboard-deferred-chunks.tsx"),
  "utf8",
);
const manifestLoaderSource = readDeferredChunkImportLoaderSource();

const bannedStaticImports = [
  '@/components/operator/OperatorWelcomeOnboarding"',
  '@/components/sponsor/SponsorDashboardHowItWorks"',
  '@/components/SponsorWorkspaceHealthDashboard"',
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
    expect(pageSource).toContain("SponsorRoiDashboardPageViewDeferred");
    expect(pageSource).not.toContain("next/dynamic");
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

  it("dynamic-imports every sponsor dashboard panel via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain('import("@/components/operator/OperatorWelcomeOnboarding")');
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
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiTrendSection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiEnvironmentSavingsSection")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorDashboardSupportingMetricsSection")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/SponsorWorkspaceHealthDashboard")');
    expect(deferredSource).toContain("sponsor-roi-dashboard-welcome-onboarding");
    expect(deferredSource).toContain("sponsor-roi-dashboard-roi-trend");
    expect(deferredSource).toContain("sponsor-roi-dashboard-environment-savings");
    expect(deferredSource).toContain("sponsor-roi-dashboard-supporting-metrics");
    expect(deferredSource).toContain("sponsor-roi-dashboard-workspace-health");
    expect(deferredSource).toContain("sponsor-roi-dashboard-page-view");
    expect(deferredSource).toContain("sponsor-roi-dashboard-systemic-issue-trend-chart");
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiDashboardPageView")',
    );
    expect(manifestLoaderSource).toContain('import("@/components/SponsorRoiSystemicIssueTrendChart")');
  });

  it("keeps systemic issue trend chart off SponsorRoiSummarySection static import graph", () => {
    const summarySource = readFileSync(join(sectionsDir, "SponsorRoiSummarySection.tsx"), "utf8");

    expect(summarySource).not.toContain("next/dynamic");
    expect(summarySource).not.toMatch(/import\s+\{\s*SponsorRoiSystemicIssueTrendChart\s*\}\s+from/);
    expect(summarySource).toContain("SponsorRoiSystemicIssueTrendChartDeferred");
    expect(summarySource).toContain("sponsor-roi-dashboard-deferred-chunks");
  });
});
