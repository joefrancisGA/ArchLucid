"use client";

import { cn } from "@/lib/utils";

import {
  ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE,
} from "@/lib/architecture/architecture-scorecard-page-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  REVIEW_SCORECARD_FINALIZED_HREF,
  REVIEW_SCORECARD_GOVERNANCE_HREF,
  REVIEW_SCORECARD_ROI_ASSUMPTIONS_HREF,
} from "@/lib/pilot-scorecard-present";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";
import type {
  ReviewScorecardMetricDisplay,
  ReviewScorecardOperationalMetric,
  ReviewScorecardSummaryRow,
} from "@/lib/pilot-scorecard-present";

import {
  ScorecardMetricCard,
  ScorecardSavingsClaimDiscipline,
  ScorecardSavingsHero,
  ScorecardSummaryTile,
} from "./ScorecardMetricCard";

export type PilotScorecardPrimaryOutcomesProps = {
  readonly savingsReady: boolean;
  readonly finalizedDisplay: ReviewScorecardMetricDisplay | null;
  readonly governanceDisplay: ReviewScorecardMetricDisplay | null;
  readonly operationalMetrics: readonly ReviewScorecardOperationalMetric[];
  readonly summaryRow: ReviewScorecardSummaryRow;
  readonly showPreviewBadge: boolean;
  readonly quarterlySavingsLabel: string | null;
};

export function PilotScorecardPrimaryOutcomes({
  savingsReady,
  finalizedDisplay,
  governanceDisplay,
  operationalMetrics,
  summaryRow,
  showPreviewBadge,
  quarterlySavingsLabel,
}: PilotScorecardPrimaryOutcomesProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const savingsClaimDiscipline =
    buyerPolishedShell ? null : (
      <ScorecardSavingsClaimDiscipline>{ARCHITECTURE_SCORECARD_CLAIM_DISCIPLINE}</ScorecardSavingsClaimDiscipline>
    );

  return (
    <section aria-label="Primary outcomes" className="space-y-3" data-testid="review-scorecard-summary-row">
      {!savingsReady ? (
        <>
          {finalizedDisplay !== null && governanceDisplay !== null ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ScorecardSummaryTile
                label="Reviews finalized"
                value={finalizedDisplay.value}
                detail={
                  finalizedDisplay.state === "measured"
                    ? "Finalized packages in the current workspace."
                    : finalizedDisplay.detail
                }
                empty={finalizedDisplay.empty}
                metricState={finalizedDisplay.state}
                useKpiEmphasis={finalizedDisplay.useKpiEmphasis}
                emphasis="primary"
                href={REVIEW_SCORECARD_FINALIZED_HREF}
                drillDownLabel="View architecture reviews"
              />
              <ScorecardSummaryTile
                label="Approval"
                value={governanceDisplay.value}
                detail={
                  governanceDisplay.state === "measured"
                    ? "Completed approval in scope."
                    : governanceDisplay.detail
                }
                empty={governanceDisplay.empty}
                metricState={governanceDisplay.state}
                useKpiEmphasis={governanceDisplay.useKpiEmphasis}
                emphasis="primary"
                href={REVIEW_SCORECARD_GOVERNANCE_HREF}
                drillDownLabel="View approval queue"
              />
            </div>
          ) : null}

          <section aria-labelledby="scorecard-metrics">
            <h2 id="scorecard-metrics" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              Operational metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {operationalMetrics.map((metric) => (
                <ScorecardMetricCard
                  key={metric.key}
                  title={metric.title}
                  value={metric.value}
                  detail={metric.detail}
                  empty={metric.empty}
                  metricState={metric.metricState}
                  useKpiEmphasis={metric.useKpiEmphasis}
                  href={metric.href}
                  drillDownLabel={metric.drillDownLabel}
                  sourceDisclosure={metric.sourceDisclosure}
                />
              ))}
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start">
            <ScorecardSavingsHero
              compact
              empty={!summaryRow.estimatedReviewTimeSavingsReady}
              value={summaryRow.estimatedReviewTimeSavingsLabel}
              detail={summaryRow.estimatedReviewTimeSavingsDetail}
              actionHref={!summaryRow.estimatedReviewTimeSavingsReady ? REVIEW_SCORECARD_ROI_ASSUMPTIONS_HREF : null}
              actionLabel={!summaryRow.estimatedReviewTimeSavingsReady ? "Configure ROI assumptions" : null}
            />
            {savingsClaimDiscipline}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
            <ScorecardSavingsHero
              empty={false}
              value={summaryRow.estimatedReviewTimeSavingsLabel}
              detail={
                showPreviewBadge
                  ? `${summaryRow.estimatedReviewTimeSavingsDetail} Preview updates as you edit — save to persist for the workspace.`
                  : summaryRow.estimatedReviewTimeSavingsDetail
              }
              secondaryLabel={
                quarterlySavingsLabel !== null ? `≈ ${quarterlySavingsLabel} per quarter` : null
              }
            />
            {savingsClaimDiscipline}
          </div>

          {finalizedDisplay !== null && governanceDisplay !== null ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ScorecardSummaryTile
                label="Reviews finalized"
                value={finalizedDisplay.value}
                detail={
                  finalizedDisplay.state === "measured"
                    ? "Finalized packages in the current workspace."
                    : finalizedDisplay.detail
                }
                empty={finalizedDisplay.empty}
                metricState={finalizedDisplay.state}
                useKpiEmphasis={finalizedDisplay.useKpiEmphasis}
                emphasis="primary"
                href={REVIEW_SCORECARD_FINALIZED_HREF}
                drillDownLabel="View architecture reviews"
              />
              <ScorecardSummaryTile
                label="Approval"
                value={governanceDisplay.value}
                detail={
                  governanceDisplay.state === "measured"
                    ? "Completed approval in scope."
                    : governanceDisplay.detail
                }
                empty={governanceDisplay.empty}
                metricState={governanceDisplay.state}
                useKpiEmphasis={governanceDisplay.useKpiEmphasis}
                emphasis="primary"
                href={REVIEW_SCORECARD_GOVERNANCE_HREF}
                drillDownLabel="View approval queue"
              />
            </div>
          ) : null}

          <section aria-labelledby="scorecard-metrics-ready">
            <h2 id="scorecard-metrics-ready" className={cn("mb-3", OPERATOR_NAV_GROUP_LABEL)}>
              Operational metrics
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {operationalMetrics.map((metric) => (
                <ScorecardMetricCard
                  key={metric.key}
                  title={metric.title}
                  value={metric.value}
                  detail={metric.detail}
                  empty={metric.empty}
                  metricState={metric.metricState}
                  useKpiEmphasis={metric.useKpiEmphasis}
                  href={metric.href}
                  drillDownLabel={metric.drillDownLabel}
                  sourceDisclosure={metric.sourceDisclosure}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
