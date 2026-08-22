"use client";

import { cn } from "@/lib/utils";

import { SponsorReportMetricCard } from "@/components/sponsor-report/SponsorReportMetricCard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  computeRoiSummaryPeriodMetrics,
  formatRoiSummaryHoursDisplay,
  formatRoiSummaryUsdWithRateBasis,
  type RoiSummaryPeriodInput,
} from "@/lib/roi-summary-sponsor-presentation";

type Props = {
  readonly period: RoiSummaryPeriodInput;
  readonly hourlyUsd: number;
  readonly windowLabel: string;
  readonly isDefaultRate?: boolean;
  readonly demoDerived?: boolean;
};

export function RoiSummaryHeroStrip(props: Props) {
  const metrics = computeRoiSummaryPeriodMetrics(props.period, props.hourlyUsd);
  const usd = formatRoiSummaryUsdWithRateBasis(
    metrics.hours,
    metrics.usdEstimate,
    metrics.showUsdEstimate,
    { isDefaultRate: props.isDefaultRate ?? true, demoDerived: props.demoDerived },
  );

  return (
    <section
      aria-labelledby="roi-summary-hero-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="roi-summary-hero-strip"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="roi-summary-hero-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Value at a glance
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.windowLabel}</p>
        </div>
        <p className={cn("m-0 rounded-full bg-neutral-100 px-3 py-1 text-al-text-secondary dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.badge)}>
          {metrics.confidence.label}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SponsorReportMetricCard
          title="Estimated hours saved"
          value={formatRoiSummaryHoursDisplay(metrics.hours)}
        />
        <SponsorReportMetricCard
          title="Estimated dollar value"
          value={usd.display}
          hint={usd.rateBasisLabel}
        />
        <SponsorReportMetricCard title="Findings counted" value={String(metrics.findingsCounted)} />
        <SponsorReportMetricCard title="Approval-check blocks counted" value={String(metrics.blocksCounted)} />
        <SponsorReportMetricCard
          title="Data completeness"
          value={metrics.confidence.completenessLabel}
        />
      </div>
    </section>
  );
}
