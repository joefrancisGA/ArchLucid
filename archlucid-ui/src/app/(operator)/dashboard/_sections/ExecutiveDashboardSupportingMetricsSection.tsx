"use client";

import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { QualityGateMetricsTile } from "@/components/QualityGateMetricsTile";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ExecutiveOrphanCandidatesCard } from "./ExecutiveOrphanCandidatesCard";
import { ExecutiveRoiDashboardLiveKpiCards } from "./ExecutiveRoiDashboardLiveKpiCards";
import { ExecutiveSqlBackupRegionVerificationCard } from "./ExecutiveSqlBackupRegionVerificationCard";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";

export type ExecutiveDashboardSupportingMetricsSectionProps = {
  readonly summary: ExecutiveRoiSummary | null;
  readonly loading: boolean;
  readonly showDetailedKpiCards: boolean;
};

/** Governance and evidence signals moved behind disclosure on the executive dashboard. */
export function ExecutiveDashboardSupportingMetricsSection(
  props: ExecutiveDashboardSupportingMetricsSectionProps,
): React.JSX.Element {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const { summary, loading, showDetailedKpiCards } = props;

  return (
    <CollapsibleSection
      title={v.supportingMetricsSectionTitle}
      sectionTestId="executive-dashboard-supporting-metrics"
    >
      <div className="space-y-4">
        {showDetailedKpiCards ? (
          <>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {v.globalZeroCountsFootnote}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ExecutiveRoiDashboardLiveKpiCards
                summary={summary}
                loading={loading}
                variant="executive-details"
              />
            </div>
          </>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ExecutiveOrphanCandidatesCard surface="executive" />
          <ExecutiveSqlBackupRegionVerificationCard />
          <QualityGateMetricsTile surface="executive" />
        </div>
      </div>
    </CollapsibleSection>
  );
}
