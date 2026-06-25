"use client";

import Link from "next/link";

import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { BUYER_TERMINOLOGY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";

import { PilotValueReportMetricCard } from "./PilotValueReportMetricCard";
import { PilotValueReportSeverityBars } from "./PilotValueReportSeverityBars";
import { PilotRoiValidationHandoffClient } from "@/components/pilots/PilotRoiValidationHandoffCard";
import { formatPilotValueReportAvgCompletion } from "./pilot-value-report-page-helpers";
import type { PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";

type Props = {
  readonly model: PilotValueReportPilotPageViewModel;
};

export function PilotValueReportPageView(props: Props) {
  const m = props.model;

  return (
    <div className="w-full max-w-[1440px] space-y-4 print:w-full">
      <LayerHeader pageKey="value-report-pilot" />
      <ValueReportOutcomesNav />
      <DocumentLayout>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{BUYER_TERMINOLOGY.evaluationValueReport}</h1>
        <p className={cn("doc-meta m-0", OPERATOR_TYPOGRAPHY.helper)}>
          One-click proof-of-ROI snapshot: committed reviews, findings, pipeline timing, governance signals, and audit-backed
          recommendation counts for the selected UTC window (<code className={OPERATOR_TYPOGRAPHY.micro}>toUtc</code> is exclusive, matching the audit
          export).
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <Link href="/value-report/roi" className={OPERATOR_LINK.inline}>
            Open ROI summary
          </Link>
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>From UTC</span>
            <input
              type="datetime-local"
              className={cn(
                "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={m.fromUtc}
              onChange={(e) => m.setFromUtc(e.target.value)}
            />
          </label>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>To UTC (exclusive)</span>
            <input
              type="datetime-local"
              className={cn(
                "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={m.toUtc}
              onChange={(e) => m.setToUtc(e.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" onClick={() => void m.load()} disabled={m.busy}>
            Refresh
          </Button>
          <Button type="button" variant="default" onClick={() => void m.onDownloadMarkdown()} disabled={m.busy || !m.data}>
            Download as Markdown
          </Button>
          <Button type="button" variant="outline" onClick={() => void m.onEmailSponsor()} disabled={m.busy}>
            Email to sponsor
          </Button>
        </div>

        {m.error ? (
          <OperatorApiProblem
            fallbackMessage={m.error.message}
            problem={m.error.problem}
            correlationId={m.error.correlationId}
          />
        ) : null}

        {m.data ? (
          <div className="space-y-6">
            <div className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.body)}>
              {m.data.runDetailsTruncated ? (
                <p className="m-0">
                  Finding and timing aggregates cap at {m.data.runDetailCap} earliest committed reviews in the window; total committed reviews
                  shown separately.
                </p>
              ) : null}
              {m.data.auditExportTruncated ? (
                <p className={`m-0${m.data.runDetailsTruncated ? " mt-2" : ""}`}>
                  Audit export hit the row cap; governance and recommendation tallies may be incomplete for very busy tenants.
                </p>
              ) : null}
              {!m.data.runDetailsTruncated && !m.data.auditExportTruncated ? (
                <p className="m-0">All committed reviews in the window are reflected in detail metrics (within product caps).</p>
              ) : null}
            </div>

            {m.data.committedRunsTimeline[0]?.runId ? (
              <PilotRoiValidationHandoffClient runId={m.data.committedRunsTimeline[0].runId} />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PilotValueReportMetricCard title="Committed reviews" value={m.data.totalRunsCommitted.toString()} />
              <PilotValueReportMetricCard title="Total findings" value={m.data.totalFindings.toString()} />
              <PilotValueReportMetricCard
                title="Avg completion"
                value={formatPilotValueReportAvgCompletion(m.data.averagePipelineCompletionSeconds)}
              />
              <PilotValueReportMetricCard
                title="Recommendations (audit)"
                value={m.data.totalRecommendationsProduced.toString()}
                hint="RecommendationGenerated events"
              />
            </div>

            <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Severity distribution</h2>
              <PilotValueReportSeverityBars counts={m.data.findingsBySeverity} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Governance &amp; policy</h2>
                <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
                  <li>Approvals: {m.data.governanceApprovals}</li>
                  <li>Rejections: {m.data.governanceRejections}</li>
                  <li>Policy pack assignments: {m.data.policyPackAssignments}</li>
                  <li>Comparison / drift detections: {m.data.comparisonOrDriftDetections}</li>
                  <li>Pending approvals (now): {m.data.governancePendingApprovalsNow}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Agent types</h2>
                <p className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.body)}>
                  {m.data.uniqueAgentTypes.length ? m.data.uniqueAgentTypes.join(", ") : "—"}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className={cn("mt-0", OPERATOR_NAV_GROUP_LABEL)}>Review timeline (detail sample)</h2>
              <div className="overflow-x-auto">
                <table className={cn("min-w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                  <thead className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
                    <tr>
                      <th className="py-2 pr-3">Review ID</th>
                      <th className="py-2 pr-3">Created</th>
                      <th className="py-2 pr-3">Committed</th>
                      <th className="py-2">System</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.data.committedRunsTimeline.map((row) => (
                      <tr key={row.runId} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className={cn("py-2 pr-3 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{row.runId}</td>
                        <td className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>
                          {new Date(row.createdUtc).toISOString()}
                        </td>
                        <td className={cn("py-2 pr-3", OPERATOR_TYPOGRAPHY.helper)}>
                          {row.committedUtc ? new Date(row.committedUtc).toISOString() : "—"}
                        </td>
                        <td className={cn("py-2", OPERATOR_TYPOGRAPHY.helper)}>{row.systemName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </DocumentLayout>
    </div>
  );
}
