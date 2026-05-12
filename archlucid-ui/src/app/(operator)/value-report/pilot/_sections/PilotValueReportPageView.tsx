"use client";

import Link from "next/link";

import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";

import { PilotValueReportMetricCard } from "./PilotValueReportMetricCard";
import { PilotValueReportSeverityBars } from "./PilotValueReportSeverityBars";
import { formatPilotValueReportAvgCompletion } from "./pilot-value-report-page-helpers";
import type { PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";

type Props = {
  readonly model: PilotValueReportPilotPageViewModel;
};

export function PilotValueReportPageView(props: Props) {
  const m = props.model;

  return (
    <div className="mx-auto space-y-4 p-4 print:w-full">
      <LayerHeader pageKey="value-report-pilot" />
      <DocumentLayout>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Pilot value report</h1>
        <p className="doc-meta m-0 text-sm text-neutral-600 dark:text-neutral-400">
          One-click proof-of-ROI snapshot: committed reviews, findings, pipeline timing, governance signals, and audit-backed
          recommendation counts for the selected UTC window (<code className="text-xs">toUtc</code> is exclusive, matching the audit
          export).
        </p>
        <p className="m-0 text-sm">
          <Link href="/value-report/roi" className="font-medium text-blue-700 underline dark:text-blue-400">
            Open ROI summary
          </Link>
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600 dark:text-neutral-400">From UTC</span>
            <input
              type="datetime-local"
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
              value={m.fromUtc}
              onChange={(e) => m.setFromUtc(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-neutral-600 dark:text-neutral-400">To UTC (exclusive)</span>
            <input
              type="datetime-local"
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-950"
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              {m.data.runDetailsTruncated ? (
                <p className="m-0">
                  Finding and timing aggregates cap at {m.data.runDetailCap} earliest committed runs in the window; total committed runs
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
              <h2 className="mt-0 text-lg font-medium text-neutral-900 dark:text-neutral-100">Severity distribution</h2>
              <PilotValueReportSeverityBars counts={m.data.findingsBySeverity} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mt-0 text-lg font-medium text-neutral-900 dark:text-neutral-100">Governance &amp; policy</h2>
                <ul className="m-0 list-none space-y-2 p-0 text-sm text-neutral-700 dark:text-neutral-300">
                  <li>Approvals: {m.data.governanceApprovals}</li>
                  <li>Rejections: {m.data.governanceRejections}</li>
                  <li>Policy pack assignments: {m.data.policyPackAssignments}</li>
                  <li>Comparison / drift detections: {m.data.comparisonOrDriftDetections}</li>
                  <li>Pending approvals (now): {m.data.governancePendingApprovalsNow}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mt-0 text-lg font-medium text-neutral-900 dark:text-neutral-100">Agent types</h2>
                <p className="m-0 font-mono text-sm text-neutral-800 dark:text-neutral-200">
                  {m.data.uniqueAgentTypes.length ? m.data.uniqueAgentTypes.join(", ") : "—"}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mt-0 text-lg font-medium text-neutral-900 dark:text-neutral-100">Review timeline (detail sample)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
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
                        <td className="py-2 pr-3 font-mono text-xs">{row.runId}</td>
                        <td className="py-2 pr-3 text-xs text-neutral-600 dark:text-neutral-400">
                          {new Date(row.createdUtc).toISOString()}
                        </td>
                        <td className="py-2 pr-3 text-xs text-neutral-600 dark:text-neutral-400">
                          {row.committedUtc ? new Date(row.committedUtc).toISOString() : "—"}
                        </td>
                        <td className="py-2 text-xs">{row.systemName || "—"}</td>
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
