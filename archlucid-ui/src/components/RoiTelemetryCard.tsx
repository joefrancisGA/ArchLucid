"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  computeRoiSummaryPeriodMetrics,
  formatRoiSummaryHoursDisplay,
  formatRoiSummaryUsdWithRateBasis,
  formatRoiSummaryWindowTitle,
  type RoiSummaryPeriodInput,
} from "@/lib/roi-summary-sponsor-presentation";

export type RoiTelemetryCardProps = {
  window: "rolling30" | "pilotToDate";
  period: RoiSummaryPeriodInput;
  hourlyUsd: number;
  isDefaultRate: boolean;
  demoDerived?: boolean;
};

/**
 * Sponsor-facing ROI period card — hours, value, counts, and confidence without implementation jargon.
 */
export function RoiTelemetryCard(props: RoiTelemetryCardProps) {
  const domSuffix = props.window;
  const metrics = computeRoiSummaryPeriodMetrics(props.period, props.hourlyUsd);
  const usd = formatRoiSummaryUsdWithRateBasis(
    metrics.hours,
    metrics.usdEstimate,
    metrics.showUsdEstimate,
    { isDefaultRate: props.isDefaultRate, demoDerived: props.demoDerived },
  );
  const title = formatRoiSummaryWindowTitle(
    props.window,
    props.period.report.fromUtc,
    props.period.report.toUtc,
  );
  const blockLabel = props.period.blocks.exact
    ? String(metrics.blocksCounted)
    : `${metrics.blocksCounted} (sampled)`;

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      aria-labelledby={`roi-card-${domSuffix}`}
      data-testid={`roi-summary-period-card-${domSuffix}`}
    >
      <h2
        id={`roi-card-${domSuffix}`}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {title}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className={cn("m-0 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.tab)}>
            Hours saved
          </p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.kpiValue)}>
            {formatRoiSummaryHoursDisplay(metrics.hours)}
          </p>
        </div>
        <div>
          <p className={cn("m-0 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.tab)}>
            Estimated value
          </p>
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.kpiValue)}>
            {usd.display}
          </p>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{usd.rateBasisLabel}</p>
        </div>
        <div>
          <p className={cn("m-0 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.tab)}>
            Findings counted
          </p>
          <p className={cn("m-0 mt-1 font-medium tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.dataValue)}>
            {metrics.findingsCounted}
          </p>
        </div>
        <div>
          <p className={cn("m-0 inline-flex items-center gap-1 uppercase tracking-wide text-al-text-secondary", OPERATOR_TYPOGRAPHY.tab)}>
            Approval-check blocks
            {!props.period.blocks.exact ? (
              <FieldHelpTooltip
                label="Approval-check blocks"
                hint="Audit search may be capped; count is a lower bound."
              />
            ) : null}
          </p>
          <p className={cn("m-0 mt-1 font-medium tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.dataValue)}>
            {blockLabel}
          </p>
        </div>
      </div>

      <p className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">Confidence:</span> {metrics.confidence.label} —{" "}
        {metrics.confidence.completenessLabel}
      </p>
    </section>
  );
}
