"use client";

import { PilotRoiValidationHandoffClient } from "@/components/pilots/PilotRoiValidationHandoffCard";
import { SponsorReportMetricCard } from "@/components/sponsor-report/SponsorReportMetricCard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { formatPilotValueReportAvgCompletion } from "./pilot-value-report-page-helpers";
import { PilotValueReportSeverityBars } from "./PilotValueReportSeverityBars";

type Props = {
  readonly data: PilotValueReportJson;
  readonly executiveNarrative: string | null;
  readonly scopedRunId: string;
  readonly criticalFindings: number;
  readonly highFindings: number;
  readonly materialFindings: number;
};

export function PilotValueReportMetricsSection(props: Props) {
  const { criticalFindings, data, executiveNarrative, highFindings, materialFindings, scopedRunId } = props;
  const timelineRows = data.committedRunsTimeline ?? [];

  return (
    <>
      {executiveNarrative !== null ? (
        <section
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          aria-labelledby="pilot-summary-heading"
        >
          <h2 id="pilot-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Report summary
          </h2>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{executiveNarrative}</p>
        </section>
      ) : null}

      {(data.runDetailsTruncated || data.auditExportTruncated) && (
        <div
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          {data.runDetailsTruncated ? (
            <p className="m-0">
              Detailed review metrics include up to {data.runDetailCap} earliest finalized reviews in this
              period. Total finalized reviews are shown separately.
            </p>
          ) : null}
          {data.auditExportTruncated ? (
            <p className={`m-0${data.runDetailsTruncated ? " mt-2" : ""}`}>
              Governance and recommendation totals may be incomplete for very busy workspaces.
            </p>
          ) : null}
        </div>
      )}

      {scopedRunId.length > 0 ? (
        <PilotRoiValidationHandoffClient runId={scopedRunId} />
      ) : null}

      <section aria-labelledby="review-activity-heading">
        <h2 id="review-activity-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Review activity
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SponsorReportMetricCard title="Finalized reviews" value={data.totalRunsCommitted.toString()} />
          <SponsorReportMetricCard
            title="Architectures reviewed"
            value={new Set(timelineRows.map((row) => row.systemName).filter(Boolean)).size.toString()}
          />
          <SponsorReportMetricCard
            title="Average review completion time"
            value={formatPilotValueReportAvgCompletion(data.averagePipelineCompletionSeconds)}
          />
          <SponsorReportMetricCard
            title="Systems in period"
            value={timelineRows.length > 0 ? String(timelineRows.length) : "Not available"}
          />
        </div>
      </section>

      <section aria-labelledby="risk-discovery-heading">
        <h2 id="risk-discovery-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Risk discovery
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SponsorReportMetricCard title="Total findings" value={data.totalFindings.toString()} />
          <SponsorReportMetricCard title="Critical findings" value={String(criticalFindings)} />
          <SponsorReportMetricCard title="High findings" value={String(highFindings)} />
          <SponsorReportMetricCard title="Material findings" value={String(materialFindings)} />
        </div>
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Severity distribution</h3>
          <PilotValueReportSeverityBars counts={data.findingsBySeverity} />
        </div>
      </section>
    </>
  );
}
