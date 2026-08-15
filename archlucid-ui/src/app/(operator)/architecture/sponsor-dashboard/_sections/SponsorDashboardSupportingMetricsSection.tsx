"use client";

import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { QualityGateMetricsTile } from "@/components/QualityGateMetricsTile";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SponsorOrphanCandidatesCard } from "./SponsorOrphanCandidatesCard";
import { SponsorRoiDashboardLiveKpiCards } from "./SponsorRoiDashboardLiveKpiCards";
import { SponsorSqlBackupRegionVerificationCard } from "./SponsorSqlBackupRegionVerificationCard";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";

export type SponsorDashboardSupportingMetricsSectionProps = {
  readonly summary: SponsorRoiSummary | null;
  readonly loading: boolean;
  readonly showDetailedKpiCards: boolean;
};

/** Governance and evidence signals moved behind disclosure on the sponsor dashboard. */
export function SponsorDashboardSupportingMetricsSection(
  props: SponsorDashboardSupportingMetricsSectionProps,
): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const { summary, loading, showDetailedKpiCards } = props;

  return (
    <CollapsibleSection
      title={v.supportingMetricsSectionTitle}
      sectionTestId="sponsor-dashboard-supporting-metrics"
    >
      <div className="space-y-4">
        {showDetailedKpiCards ? (
          <>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {v.globalZeroCountsFootnote}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SponsorRoiDashboardLiveKpiCards
                summary={summary}
                loading={loading}
                variant="sponsor-details"
              />
            </div>
          </>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SponsorOrphanCandidatesCard surface="sponsor" />
          <SponsorSqlBackupRegionVerificationCard />
          <QualityGateMetricsTile surface="sponsor" />
        </div>
      </div>
    </CollapsibleSection>
  );
}
