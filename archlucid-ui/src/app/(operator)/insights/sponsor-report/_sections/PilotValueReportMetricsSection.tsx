"use client";

import { PilotRoiValidationHandoffClient } from "@/components/pilots/PilotRoiValidationHandoffCard";
import { PolicyPackInfluenceHonestyChip } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import { SponsorReportMetricCard } from "@/components/sponsor-report/SponsorReportMetricCard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import { cn } from "@/lib/utils";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import { resolveRoiTileSectionHeading } from "@/lib/roi/roi-tile-career-honesty";

import {
  pilotValueReportMaterialFindingsDisplay,
  pilotValueReportSeverityCountDisplay,
  pilotValueReportTotalFindingsDisplay,
} from "@/lib/sponsor/pilot-value-report-count-display";

import { formatPilotValueReportAvgCompletion } from "./pilot-value-report-page-helpers";
import { PilotValueReportSeverityBars } from "./PilotValueReportSeverityBars";

type Props = {
  readonly data: PilotValueReportJson;
  readonly executiveNarrative: string | null;
  readonly scopedRunId: string;
  readonly criticalFindings: number | undefined;
  readonly highFindings: number | undefined;
  readonly roiSectionQualifier?: string | null;
};

export function PilotValueReportMetricsSection(props: Props) {
  const {
    criticalFindings,
    data,
    executiveNarrative,
    highFindings,
    roiSectionQualifier = null,
    scopedRunId,
  } = props;
  const timelineRows = data.committedRunsTimeline;
  const timelineOmitted = data.committedRunsTimeline === undefined;
  const architecturesReviewedLine = (() => {
    if (timelineOmitted) {
      return "Review list was not stored.";
    }

    const rows = timelineRows ?? [];
    const missingNames = rows.filter((row) => (row.systemName?.trim() ?? "").length === 0).length;

    if (missingNames > 0) {
      return `${rows.length - missingNames} named · ${missingNames} system name was not stored`;
    }

    return new Set(rows.map((row) => row.systemName).filter(Boolean)).size.toString();
  })();
  const reviewActivityHeading = resolveRoiTileSectionHeading("Review activity", roiSectionQualifier);
  const riskDiscoveryHeading = resolveRoiTileSectionHeading("Risk discovery", roiSectionQualifier);

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
        <>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="pilot-value-report-metrics-non-summing">
            {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
          </p>
          <PolicyPackInfluenceHonestyChip />
          <PilotRoiValidationHandoffClient runId={scopedRunId} />
        </>
      ) : null}

      <section aria-labelledby="review-activity-heading">
        <h2 id="review-activity-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {reviewActivityHeading}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SponsorReportMetricCard title="Finalized reviews" value={data.totalRunsCommitted.toString()} />
          <SponsorReportMetricCard title="Architectures reviewed" value={architecturesReviewedLine} />
          <SponsorReportMetricCard
            title="Average review completion time"
            value={formatPilotValueReportAvgCompletion(data.averagePipelineCompletionSeconds)}
          />
          <SponsorReportMetricCard
            title="Systems in period"
            value={
              timelineOmitted
                ? "Review list was not stored."
                : (timelineRows?.length ?? 0) > 0
                  ? String(timelineRows?.length ?? 0)
                  : "No systems were recorded."
            }
          />
        </div>
      </section>

      <section aria-labelledby="risk-discovery-heading">
        <h2 id="risk-discovery-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {riskDiscoveryHeading}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SponsorReportMetricCard
            title="Total findings"
            value={pilotValueReportTotalFindingsDisplay(data.totalFindings)}
          />
          <SponsorReportMetricCard
            title="Critical findings"
            value={pilotValueReportSeverityCountDisplay(criticalFindings, "Critical")}
          />
          <SponsorReportMetricCard
            title="High findings"
            value={pilotValueReportSeverityCountDisplay(highFindings, "High")}
          />
          <SponsorReportMetricCard
            title="Material findings"
            value={pilotValueReportMaterialFindingsDisplay(criticalFindings, highFindings)}
          />
        </div>
        <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Severity distribution</h3>
          <PilotValueReportSeverityBars counts={data.findingsBySeverity} />
        </div>
      </section>
    </>
  );
}
