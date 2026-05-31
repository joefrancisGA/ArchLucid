import { OperatorWelcomeOnboarding } from "@/components/OperatorWelcomeOnboarding";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import { ExecutiveComplianceDriftTrendSection } from "./ExecutiveComplianceDriftTrendSection";
import { ExecutiveDashboardBaselineWarningBanner } from "./ExecutiveDashboardBaselineWarningBanner";
import { ExecutiveOrphanCandidatesCard } from "./ExecutiveOrphanCandidatesCard";
import { ExecutiveRoiDashboardLiveKpiCards } from "./ExecutiveRoiDashboardLiveKpiCards";
import { ExecutiveRoiEnvironmentSavingsSection } from "./ExecutiveRoiEnvironmentSavingsSection";
import { ExecutiveRoiSummarySection } from "./ExecutiveRoiSummarySection";
import { ExecutiveRoiTrendSection } from "./ExecutiveRoiTrendSection";
import { SponsorExportsSection } from "./SponsorExportsSection";
import { ExecutiveSqlBackupRegionVerificationCard } from "./ExecutiveSqlBackupRegionVerificationCard";
import { BusinessImpactSummaryWidget } from "./BusinessImpactSummaryWidget";

export function ExecutiveRoiDashboardPageView() {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
      <ExecutiveDashboardBaselineWarningBanner />
      <OperatorWelcomeOnboarding />
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">
          {v.pageTitle}
        </h1>
        <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-300">{v.pageLead}</p>
      </header>

      <section aria-labelledby="exec-roi-heading">
        <h2 id="exec-roi-heading" className="sr-only">
          {v.roiMetricsSrOnly}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ExecutiveRoiDashboardLiveKpiCards />
          <ExecutiveOrphanCandidatesCard />
          <ExecutiveSqlBackupRegionVerificationCard />
        </div>
      </section>

      <BusinessImpactSummaryWidget />

      <section aria-label="Executive portfolio summary and sponsor exports" className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExecutiveRoiSummarySection />
        </div>
        <SponsorExportsSection />
      </section>

      <ExecutiveComplianceDriftTrendSection />

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecutiveRoiTrendSection />
        <ExecutiveRoiEnvironmentSavingsSection />
      </div>
    </div>
  );
}
