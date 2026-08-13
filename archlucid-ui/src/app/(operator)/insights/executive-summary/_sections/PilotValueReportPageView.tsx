"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo, useRef } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DocumentLayout } from "@/components/DocumentLayout";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { LayerHeader } from "@/components/LayerHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { SPONSOR_REPORT_PILOT_OUTCOMES_PATH } from "@/lib/sponsor-report-navigation";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { formatPilotOutcomesAnalysisCoverage } from "@/lib/pilot-outcomes-agent-type-labels";
import { buildPilotOutcomesExecutiveNarrative } from "@/lib/pilot-outcomes-executive-summary";
import { PILOT_OUTCOMES_PERIOD_PRESETS } from "@/lib/pilot-outcomes-period-presets";
import {
  buildPilotOutcomesEmptyDiagnostics,
  pilotOutcomesReportHasFinalizedReviews,
} from "@/lib/pilot-outcomes-report-diagnostics";
import {
  PILOT_OUTCOMES_PAGE_SUBTITLE,
  PILOT_OUTCOMES_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

import { PilotOutcomesEmailConfirmDialog } from "./PilotOutcomesEmailConfirmDialog";
import { PilotOutcomesEmptyState } from "./PilotOutcomesEmptyState";
import { PilotValueReportMetricCard } from "@/app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportMetricCard";
import { PilotValueReportSeverityBars } from "./PilotValueReportSeverityBars";
import { PilotRoiValidationHandoffClient } from "@/components/pilots/PilotRoiValidationHandoffCard";
import { formatPilotValueReportAvgCompletion } from "./pilot-value-report-page-helpers";
import type { PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";

type Props = {
  readonly model: PilotValueReportPilotPageViewModel;
};

function formatReviewDate(iso: string | null): string {
  if (iso === null || iso.length === 0) {
    return "Not available";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function PilotValueReportPageView(props: Props) {
  const m = props.model;
  const periodControlsRef = useRef<HTMLDivElement>(null);

  const hasFinalizedReviews = pilotOutcomesReportHasFinalizedReviews(m.data);
  const emptyDiagnostics = useMemo(
    () => buildPilotOutcomesEmptyDiagnostics(m.data, m.fromUtc, m.toUtc, m.includesSampleData),
    [m.data, m.fromUtc, m.includesSampleData, m.toUtc],
  );
  const executiveNarrative = m.data !== null && hasFinalizedReviews ? buildPilotOutcomesExecutiveNarrative(m.data) : null;
  const criticalFindings = m.data?.findingsBySeverity.critical ?? 0;
  const highFindings = m.data?.findingsBySeverity.high ?? 0;
  const materialFindings = criticalFindings + highFindings;
  const timelineCap = m.data?.runDetailCap ?? 0;
  const timelineRows = m.data?.committedRunsTimeline ?? [];
  const showTimelineCapNote = m.data?.runDetailsTruncated === true && timelineCap > 0;

  const scrollToPeriodControls = () => {
    periodControlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="w-full max-w-[1440px] space-y-4 print:w-full" data-testid="pilot-outcomes-page">
      {buyerPolishedShell ? null : <LayerHeader pageKey="value-report-pilot" />}
      <ValueReportOutcomesNav />
      <DocumentLayout>
        <OperatorPageHeader
          navHref={SPONSOR_REPORT_PILOT_OUTCOMES_PATH}
          title={PILOT_OUTCOMES_PAGE_TITLE}
          headingLevel="h1"
          subtitle={buyerPolishedShell ? PILOT_OUTCOMES_PAGE_SUBTITLE : null}
          actions={<PageContextualHelpButton />}
        />

        {m.includesSampleData ? (
          <div
            role="status"
            className={cn(
              "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="pilot-outcomes-sample-banner"
          >
            Sample sponsor report — figures come from the demonstration workspace, not production pilot performance.
          </div>
        ) : null}

        <div ref={periodControlsRef} className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Reporting period</h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Times shown in {m.reportingTimezoneLabel}. Period boundaries are stored in UTC; the end date is exclusive
            when calculating the report window.
          </p>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Reporting period presets">
            {PILOT_OUTCOMES_PERIOD_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={m.periodPreset === preset.id ? "default" : "outline"}
                onClick={() => m.applyPeriodPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
              <span className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>{OPERATOR_DATE_RANGE_START_LABEL}</span>
              <input
                type="datetime-local"
                className={cn(
                  "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                value={m.fromUtc}
                onChange={(e) => {
                  m.setPeriodPreset("custom");
                  m.setFromUtc(e.target.value);
                }}
              />
            </label>
            <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
              <span className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>{OPERATOR_DATE_RANGE_END_LABEL}</span>
              <input
                type="datetime-local"
                className={cn(
                  "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                value={m.toUtc}
                onChange={(e) => {
                  m.setPeriodPreset("custom");
                  m.setToUtc(e.target.value);
                }}
              />
            </label>
            <Button
              type="button"
              variant="default"
              onClick={() => void m.load()}
              disabled={m.busy}
              aria-busy={m.busy}
            >
              {m.busy ? "Generating sponsor report…" : "Apply period"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void m.onDownloadReport("markdown")}
            disabled={m.busy || m.exportBusy || !hasFinalizedReviews}
            aria-busy={m.exportBusy}
          >
            {m.exportBusy ? "Preparing download…" : "Download report"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={m.openEmailPreview}
            disabled={m.busy || m.emailBusy}
          >
            Send executive briefing
          </Button>
          <Link href={SPONSOR_REPORT_ROI_SUMMARY_PATH} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}>
            Open ROI summary
          </Link>
        </div>

        {m.error ? (
          <OperatorApiProblem
            fallbackMessage={m.error.message}
            problem={m.error.problem}
            correlationId={m.error.correlationId}
          />
        ) : null}

        {m.busy && m.data === null ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} role="status" aria-live="polite">
            Generating sponsor report…
          </p>
        ) : null}

        {!m.busy && m.data !== null && !hasFinalizedReviews ? (
          <PilotOutcomesEmptyState
            diagnostics={emptyDiagnostics}
            onApplyPeriod={scrollToPeriodControls}
            periodBusy={m.busy}
          />
        ) : null}

        {m.data !== null && hasFinalizedReviews ? (
          <div className={OPERATOR_LAYOUT.sectionStack}>
            {executiveNarrative !== null ? (
              <section
                className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                aria-labelledby="pilot-summary-heading"
              >
                <h2 id="pilot-summary-heading" className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>
                  Pilot summary
                </h2>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{executiveNarrative}</p>
              </section>
            ) : null}

            {(m.data.runDetailsTruncated || m.data.auditExportTruncated) && (
              <div
                className={cn(
                  "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 dark:border-amber-700/50",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                role="status"
              >
                {m.data.runDetailsTruncated ? (
                  <p className="m-0">
                    Detailed review metrics include up to {m.data.runDetailCap} earliest finalized reviews in this
                    period. Total finalized reviews are shown separately.
                  </p>
                ) : null}
                {m.data.auditExportTruncated ? (
                  <p className={`m-0${m.data.runDetailsTruncated ? " mt-2" : ""}`}>
                    Governance and recommendation totals may be incomplete for very busy workspaces.
                  </p>
                ) : null}
              </div>
            )}

            {m.data.committedRunsTimeline[0]?.runId ? (
              <PilotRoiValidationHandoffClient runId={m.data.committedRunsTimeline[0].runId} />
            ) : null}

            <section aria-labelledby="review-activity-heading">
              <h2 id="review-activity-heading" className={OPERATOR_NAV_GROUP_LABEL}>
                Review activity
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PilotValueReportMetricCard title="Finalized reviews" value={m.data.totalRunsCommitted.toString()} />
                <PilotValueReportMetricCard
                  title="Architectures reviewed"
                  value={new Set(timelineRows.map((row) => row.systemName).filter(Boolean)).size.toString()}
                />
                <PilotValueReportMetricCard
                  title="Average review completion time"
                  value={formatPilotValueReportAvgCompletion(m.data.averagePipelineCompletionSeconds)}
                />
                <PilotValueReportMetricCard
                  title="Systems in period"
                  value={timelineRows.length > 0 ? String(timelineRows.length) : "Not available"}
                />
              </div>
            </section>

            <section aria-labelledby="risk-discovery-heading">
              <h2 id="risk-discovery-heading" className={OPERATOR_NAV_GROUP_LABEL}>
                Risk discovery
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PilotValueReportMetricCard title="Total findings" value={m.data.totalFindings.toString()} />
                <PilotValueReportMetricCard title="Critical findings" value={String(criticalFindings)} />
                <PilotValueReportMetricCard title="High findings" value={String(highFindings)} />
                <PilotValueReportMetricCard title="Material findings" value={String(materialFindings)} />
              </div>
              <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h3 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Severity distribution</h3>
                <PilotValueReportSeverityBars counts={m.data.findingsBySeverity} />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2" aria-labelledby="governance-outcomes-heading">
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 id="governance-outcomes-heading" className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>
                  Governance outcomes
                </h2>
                <h3 className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}>Decisions</h3>
                <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
                  <li>
                    <InlineMetadataLabel label="Approved" /> {m.data.governanceApprovals}
                  </li>
                  <li>
                    <InlineMetadataLabel label="Rejected" /> {m.data.governanceRejections}
                  </li>
                  <li>
                    <InlineMetadataLabel label="Pending" /> {m.data.governancePendingApprovalsNow}
                  </li>
                </ul>
                <h3 className={cn("mb-2 mt-4", OPERATOR_TYPOGRAPHY.helper)}>Policy governance</h3>
                <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
                  <li>
                    <InlineMetadataLabel label="Policy packs applied" /> {m.data.policyPackAssignments}
                  </li>
                  <li>
                    <InlineMetadataLabel label="Exceptions or waivers" /> Not available
                  </li>
                </ul>
                <h3 className={cn("mb-2 mt-4", OPERATOR_TYPOGRAPHY.helper)}>Architecture-change signals</h3>
                <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
                  <li>
                    <InlineMetadataLabel label="Drift detections" /> {m.data.comparisonOrDriftDetections}
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Recommendations and remediation</h2>
                <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
                  <li>
                    <InlineMetadataLabel label="Recommendations generated" /> {m.data.totalRecommendationsProduced}
                  </li>
                  <li>
                    <InlineMetadataLabel label="Recommendations accepted" /> Not available
                  </li>
                  <li>
                    <InlineMetadataLabel label="Remediation assignments" /> Not available
                  </li>
                  <li>
                    <InlineMetadataLabel label="Findings remediated" /> Not available
                  </li>
                </ul>
                <h2 className={cn("mb-2 mt-6", OPERATOR_NAV_GROUP_LABEL)}>Analysis coverage</h2>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {formatPilotOutcomesAnalysisCoverage(m.data.uniqueAgentTypes)}
                </p>
                <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Shows which ArchLucid analysis capabilities contributed evidence to this report.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Finalized reviews</h2>
              {showTimelineCapNote ? (
                <p className={cn("m-0 mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Showing the most recent {timelineRows.length} finalized reviews.
                  <Link href="/architecture/reviews" className={cn(OPERATOR_LINK.inline, "ml-1")}>
                    View all qualifying reviews
                  </Link>
                </p>
              ) : null}
              <EnterpriseTable ariaLabel="Finalized reviews in pilot value report" className={cn("min-w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <EnterpriseTableHead className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
                  <EnterpriseTableHeadRow>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      Review
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      System
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      Created
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      Finalized
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      Outcome
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      Highest severity
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2 pr-3">
                      Open actions
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell scope="col" className="py-2">
                      Link
                    </EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {timelineRows.map((row) => (
                    <EnterpriseTableRow key={row.runId}>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.body)}>{row.systemName || row.runId}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>{row.systemName || "—"}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>{formatReviewDate(row.createdUtc)}</EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>
                        {formatReviewDate(row.committedUtc)}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>Not available</EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>Not available</EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>Not available</EnterpriseTableCell>
                      <EnterpriseTableCell className={cn("py-2", OPERATOR_TYPOGRAPHY.helper)}>
                        <Link href={`/architecture/reviews/${encodeURIComponent(row.runId)}`} className={OPERATOR_LINK.inline}>
                          Open review
                        </Link>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </section>

            <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId="pilot-outcomes-technical-details">
              <ul className={cn("m-0 list-disc pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <li>Reporting period end timestamp is exclusive (UTC).</li>
                <li>Recommendations generated are counted from audit events in the selected window.</li>
                <li>Review completion time reflects pipeline duration for finalized reviews in the detail sample.</li>
              </ul>
            </CollapsibleSection>
          </div>
        ) : null}
      </DocumentLayout>

      <PilotOutcomesEmailConfirmDialog
        open={m.emailPreviewOpen}
        preview={m.emailPreview}
        busy={m.emailBusy}
        onClose={m.closeEmailPreview}
        onConfirm={m.confirmSendEmail}
      />
    </div>
  );
}
