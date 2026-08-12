import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionsDir = dirname(fileURLToPath(import.meta.url));
const pageDir = join(sectionsDir, "..");

const pageSource = readFileSync(join(pageDir, "page.tsx"), "utf8");
const pageViewSource = readFileSync(join(sectionsDir, "ExecutiveRoiDashboardPageView.tsx"), "utf8");
const deferredSource = readFileSync(
  join(sectionsDir, "executive-roi-dashboard-deferred-chunks.tsx"),
  "utf8",
);

const bannedStaticImports = [
  '@/components/operator/OperatorWelcomeOnboarding"',
  '@/components/executive/ExecutiveDashboardHowItWorks"',
  './ExecutiveDashboardNextActionSection"',
  './ExecutiveDashboardPrimaryMetricsSection"',
  './SponsorExportsSection"',
  './BusinessImpactSummaryWidget"',
  './ExecutiveRoiSummarySection"',
  './ExecutiveComplianceDriftTrendSection"',
  './ExecutiveRoiTrendSection"',
  './ExecutiveRoiEnvironmentSavingsSection"',
  './ExecutiveDashboardSupportingMetricsSection"',
] as const;

describe("executive dashboard deferred imports (TB-2061 / wave 10)", () => {
  it("keeps ExecutiveRoiDashboardPageView off the page static import graph", () => {
    expect(pageSource).not.toContain(
      'import { ExecutiveRoiDashboardPageView } from "./_sections/ExecutiveRoiDashboardPageView"',
    );
    expect(pageSource).toContain('import("./_sections/ExecutiveRoiDashboardPageView")');
    expect(pageSource).toContain("next/dynamic");
    expect(pageSource).toContain("executive-dashboard-chunk-loading");
  });

  it("keeps below-fold panels off the page view static import graph", () => {
    for (const bannedImport of bannedStaticImports) {
      expect(pageViewSource).not.toContain(bannedImport);
    }

    expect(pageViewSource).toContain("executive-roi-dashboard-deferred-chunks");
    expect(pageViewSource).toContain("OperatorWelcomeOnboardingDeferred");
    expect(pageViewSource).toContain("ExecutiveDashboardHowItWorksDeferred");
    expect(pageViewSource).toContain("ExecutiveDashboardNextActionSectionDeferred");
    expect(pageViewSource).toContain("ExecutiveDashboardPrimaryMetricsSectionDeferred");
    expect(pageViewSource).toContain("SponsorExportsSectionDeferred");
    expect(pageViewSource).toContain("BusinessImpactSummaryWidgetDeferred");
    expect(pageViewSource).toContain("ExecutiveRoiSummarySectionDeferred");
    expect(pageViewSource).toContain("ExecutiveComplianceDriftTrendSectionDeferred");
    expect(pageViewSource).toContain("ExecutiveRoiTrendSectionDeferred");
    expect(pageViewSource).toContain("ExecutiveRoiEnvironmentSavingsSectionDeferred");
    expect(pageViewSource).toContain("ExecutiveDashboardSupportingMetricsSectionDeferred");
  });

  it("dynamic-imports each deferred executive dashboard panel", () => {
    expect(deferredSource).toContain('import("@/components/operator/OperatorWelcomeOnboarding")');
    expect(deferredSource).toContain('import("@/components/executive/ExecutiveDashboardHowItWorks")');
    expect(deferredSource).toContain('import("./ExecutiveDashboardNextActionSection")');
    expect(deferredSource).toContain('import("./ExecutiveDashboardPrimaryMetricsSection")');
    expect(deferredSource).toContain('import("./SponsorExportsSection")');
    expect(deferredSource).toContain('import("./BusinessImpactSummaryWidget")');
    expect(deferredSource).toContain('import("./ExecutiveRoiSummarySection")');
    expect(deferredSource).toContain('import("./ExecutiveComplianceDriftTrendSection")');
    expect(deferredSource).toContain('import("./ExecutiveRoiTrendSection")');
    expect(deferredSource).toContain('import("./ExecutiveRoiEnvironmentSavingsSection")');
    expect(deferredSource).toContain(
      'import("./ExecutiveDashboardSupportingMetricsSection")',
    );
    expect(deferredSource).toContain("next/dynamic");
  });
});
