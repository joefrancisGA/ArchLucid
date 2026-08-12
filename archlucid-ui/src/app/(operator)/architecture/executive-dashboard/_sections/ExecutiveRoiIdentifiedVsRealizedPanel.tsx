import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { RoiDispositionTrainingTooltip } from "@/components/roi/RoiDispositionTrainingTooltip";
import { RoiHeadlineMathTooltip } from "@/components/roi/RoiHeadlineMathTooltip";
import {
  EXECUTIVE_ROI_IDENTIFIED_PENDING_DESCRIPTION,
  EXECUTIVE_ROI_IDENTIFIED_PENDING_LABEL,
  EXECUTIVE_ROI_REALIZED_COMMITTED_DESCRIPTION,
  EXECUTIVE_ROI_REALIZED_COMMITTED_LABEL,
  type ExecutiveRoiIdentifiedVsRealizedBuckets,
} from "@/lib/executive/executive-roi-identified-vs-realized";
import { presentExecutiveEstimatedSavings } from "@/lib/executive/executive-estimated-savings-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";
import { resolveExecutiveHeadlineScopeLabel } from "@/lib/roi-sponsor-scope-labels";
import {
  formatExecutiveRoiPricingBasisLabel,
  formatRoiCostEvidenceFreshnessWarning,
  shouldShowRoiCostEvidenceFreshnessWarning,
} from "@/lib/roi-pricing-basis-label";

type ExecutiveRoiIdentifiedVsRealizedPanelProps = {
  readonly summary: ExecutiveRoiSummary;
  readonly buckets: ExecutiveRoiIdentifiedVsRealizedBuckets;
};

export function ExecutiveRoiIdentifiedVsRealizedPanel(
  props: ExecutiveRoiIdentifiedVsRealizedPanelProps,
): ReactElement {
  const { summary, buckets } = props;
  const identifiedSavings = presentExecutiveEstimatedSavings(buckets.identifiedPendingApprovalUsd, {
    loading: false,
    summary,
  });
  const realizedSavings = presentExecutiveEstimatedSavings(buckets.realizedCommittedUsd, {
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
              {EXECUTIVE_ROI_IDENTIFIED_PENDING_LABEL}
              <RoiHeadlineMathTooltip />
            </span>
          </div>
          <p
            className={cn("mt-1 text-amber-900/90 dark:text-amber-100/90", OPERATOR_TYPOGRAPHY.navHelper)}
            data-testid="exec-roi-headline-scope-description"
          >
            {resolveExecutiveHeadlineScopeLabel(summary)}
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
            {EXECUTIVE_ROI_IDENTIFIED_PENDING_DESCRIPTION}
          </p>
          <div className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="exec-roi-pricing-basis">
            {formatExecutiveRoiPricingBasisLabel(summary.savingsPricingBasis, summary.eaDiscountMultiplier)}
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
          className="rounded-md border border-teal-700/30 bg-al-surface-raised p-3 dark:border-teal-600/40"
          data-testid="exec-roi-realized-committed-card"
        >
          <div className={cn("font-medium text-teal-800 dark:text-teal-200", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="inline-flex items-baseline gap-1.5">
              {EXECUTIVE_ROI_REALIZED_COMMITTED_LABEL}
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
            <p className={cn("mt-2 text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}>{realizedSavings.footnote}</p>
          ) : null}
          <p className={cn("mt-2 text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.helper)}>
            {EXECUTIVE_ROI_REALIZED_COMMITTED_DESCRIPTION}
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
