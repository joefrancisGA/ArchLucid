"use client";

import { cn } from "@/lib/utils";

import {
  ADVISORY_SCANS_SUMMARY_ACCEPTED,
  ADVISORY_SCANS_SUMMARY_COMPARED_TO,
  ADVISORY_SCANS_SUMMARY_DEFERRED,
  ADVISORY_SCANS_SUMMARY_HIGH_IMPACT,
  ADVISORY_SCANS_SUMMARY_IMPLEMENTED,
  ADVISORY_SCANS_SUMMARY_LAST_SCAN,
  ADVISORY_SCANS_SUMMARY_RECOMMENDATIONS_GENERATED,
  ADVISORY_SCANS_SUMMARY_REJECTED,
  ADVISORY_SCANS_SUMMARY_SECTION_TITLE,
} from "@/lib/advisory-copy";
import type { AdvisoryScanSummary } from "@/lib/advisory-scan-summary";
import { OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type AdvisoryScanSummaryPanelProps = {
  readonly summary: AdvisoryScanSummary;
};

function formatScanTimestamp(utc: string): string {
  const parsed = new Date(utc);

  if (Number.isNaN(parsed.getTime())) {
    return utc;
  }

  return parsed.toLocaleString();
}

function SummaryMetric(props: { readonly label: string; readonly value: number | string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950">
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.value}
      </p>
    </div>
  );
}

/** Scan outcome summary shown after an advisory scan is generated. */
export function AdvisoryScanSummaryPanel(props: AdvisoryScanSummaryPanelProps): React.JSX.Element {
  const { summary } = props;

  return (
    <section
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "mb-6")}
      data-testid="advisory-scan-summary"
      aria-label={ADVISORY_SCANS_SUMMARY_SECTION_TITLE}
    >
      <h3 className={cn("m-0 mb-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {ADVISORY_SCANS_SUMMARY_SECTION_TITLE}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label={ADVISORY_SCANS_SUMMARY_RECOMMENDATIONS_GENERATED} value={summary.recommendationsGenerated} />
        <SummaryMetric label={ADVISORY_SCANS_SUMMARY_HIGH_IMPACT} value={summary.highImpactCount} />
        <SummaryMetric label={ADVISORY_SCANS_SUMMARY_ACCEPTED} value={summary.accepted} />
        <SummaryMetric label={ADVISORY_SCANS_SUMMARY_DEFERRED} value={summary.deferred} />
        <SummaryMetric label={ADVISORY_SCANS_SUMMARY_REJECTED} value={summary.rejected} />
        <SummaryMetric label={ADVISORY_SCANS_SUMMARY_IMPLEMENTED} value={summary.implemented} />
        <SummaryMetric
          label={ADVISORY_SCANS_SUMMARY_LAST_SCAN}
          value={summary.lastScanUtc !== null ? formatScanTimestamp(summary.lastScanUtc) : "—"}
        />
        <SummaryMetric
          label={ADVISORY_SCANS_SUMMARY_COMPARED_TO}
          value={summary.comparedToRunId ?? "Not selected"}
        />
      </div>
    </section>
  );
}
