import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { RoiDispositionTrainingTooltip } from "@/components/roi/RoiDispositionTrainingTooltip";
import { RoiHeadlineMathTooltip } from "@/components/roi/RoiHeadlineMathTooltip";
import {
  SPONSOR_ROI_IDENTIFIED_PENDING_DESCRIPTION,
  SPONSOR_ROI_IDENTIFIED_PENDING_LABEL,
  SPONSOR_ROI_REALIZED_COMMITTED_DESCRIPTION,
  SPONSOR_ROI_REALIZED_COMMITTED_LABEL,
  type SponsorRoiIdentifiedVsRealizedBuckets,
} from "@/lib/sponsor-roi-identified-vs-realized";
import { presentSponsorEstimatedSavings } from "@/lib/sponsor-estimated-savings-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { resolveSponsorHeadlineScopeLabel } from "@/lib/roi-sponsor-scope-labels";
import {
  formatSponsorRoiPricingBasisLabel,
  formatRoiCostEvidenceFreshnessWarning,
  shouldShowRoiCostEvidenceFreshnessWarning,
} from "@/lib/roi-pricing-basis-label";

type SponsorRoiIdentifiedVsRealizedPanelProps = {
  readonly summary: SponsorRoiSummary;
  readonly buckets: SponsorRoiIdentifiedVsRealizedBuckets;
};

export function SponsorRoiIdentifiedVsRealizedPanel(
  props: SponsorRoiIdentifiedVsRealizedPanelProps,
): ReactElement {
  const { summary, buckets } = props;
  const identifiedSavings = presentSponsorEstimatedSavings(buckets.identifiedPendingApprovalUsd, {
    loading: false,
    summary,
  });
  const realizedSavings = presentSponsorEstimatedSavings(buckets.realizedCommittedUsd, {
    loading: false,
    summary,
  });

  return (
    <section
      aria-labelledby="exec-roi-identified-vs-realized-heading"
      className="space-y-3"
      data-testid="exec-roi-identified-vs-realized-panel"
    >
      <div className="space-y-1">
        <h3
          id="exec-roi-identified-vs-realized-heading"
          className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}
        >
          <span className="inline-flex items-baseline gap-1.5">
            Identified vs realized savings
            <RoiDispositionTrainingTooltip />
          </span>
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Do not treat identified potential as realized value until findings are remediated through governance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          className="rounded-md border border-amber-600/30 bg-al-surface-raised p-3 dark:border-amber-700/40"
          data-testid="exec-roi-identified-pending-card"
        >
          <div className={cn("font-medium text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="inline-flex items-baseline gap-1.5">
              {SPONSOR_ROI_IDENTIFIED_PENDING_LABEL}
              <RoiHeadlineMathTooltip />
            </span>
          </div>
          <p
            className={cn("mt-1 text-amber-900/90 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.navHelper)}
            data-testid="exec-roi-headline-scope-description"
          >
            {resolveSponsorHeadlineScopeLabel(summary)}
          </p>
          <div
            className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}
            data-testid="exec-roi-identified-pending-usd"
          >
            {identifiedSavings.display}
          </div>
          {identifiedSavings.footnote ? (
            <p className={cn("mt-2 text-amber-900/90 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.helper)}>{identifiedSavings.footnote}</p>
          ) : null}
          <p className={cn("mt-2 text-amber-900/90 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.helper)}>
            {SPONSOR_ROI_IDENTIFIED_PENDING_DESCRIPTION}
          </p>
          <div className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="exec-roi-pricing-basis">
            {formatSponsorRoiPricingBasisLabel(summary.savingsPricingBasis, summary.eaDiscountMultiplier)}
          </div>
          {summary.savingsPricingBasisDescription ? (
            <p
              className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="exec-roi-pricing-basis-description"
            >
              {summary.savingsPricingBasisDescription}
            </p>
          ) : null}
        </div>

        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700"
          data-testid="exec-roi-realized-committed-card"
        >
          <div className={cn("font-medium text-al-text-secondary dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="inline-flex items-baseline gap-1.5">
              {SPONSOR_ROI_REALIZED_COMMITTED_LABEL}
              <RoiHeadlineMathTooltip />
            </span>
          </div>
          <div
            className={`mt-1 ${OPERATOR_TYPOGRAPHY.executiveDashboardMetric}`}
            data-testid="exec-roi-realized-usd"
          >
            {realizedSavings.display}
          </div>
          {realizedSavings.footnote ? (
            <p className={cn("mt-2 text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>{realizedSavings.footnote}</p>
          ) : null}
          <p className={cn("mt-2 text-al-text-primary dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>
            {SPONSOR_ROI_REALIZED_COMMITTED_DESCRIPTION}
          </p>
          {buckets.hasBasisBreakdown && buckets.deferredWaivedAcceptedUsd > 0 ? (
            <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="exec-roi-excluded-basis">
              Excluded from realized: deferred, waived, accepted-risk, or not-applicable $
              {buckets.deferredWaivedAcceptedUsd.toFixed(0)}
            </p>
          ) : null}
        </div>
      </div>

      {shouldShowRoiCostEvidenceFreshnessWarning(summary.costEvidenceFreshnessStatus) ? (
        <div
          className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.helper)}
          role="alert"
          data-testid="exec-roi-cost-evidence-freshness-warning"
        >
          {formatRoiCostEvidenceFreshnessWarning(
            summary.costEvidenceFreshnessStatus,
            summary.costEvidenceStaleAfterDays,
            summary.latestCostEvidenceCollectionTimestampUtc ?? null,
          )}
        </div>
      ) : null}
    </section>
  );
}
