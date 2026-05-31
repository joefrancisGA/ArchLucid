"use client";

import Link from "next/link";

import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { RoiTelemetryCard } from "@/components/RoiTelemetryCard";
import { Button } from "@/components/ui/button";

import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

type Props = {
  readonly model: RoiSummaryPageViewModel;
};

export function RoiSummaryPageView(props: Props) {
  const m = props.model;

  if (m.demo) {
    return (
      <div className="mx-auto space-y-4 p-4">
        <LayerHeader pageKey="value-report-roi" />
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">ROI summary not available in demo mode.</p>
        </div>
      </div>
    );
  }

  if (m.state.status === "loading") {
    return (
      <div className="mx-auto space-y-4 p-4">
        <LayerHeader pageKey="value-report-roi" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading ROI summary…</p>
      </div>
    );
  }

  if (m.state.status === "error") {
    return (
      <div className="mx-auto space-y-4 p-4">
        <LayerHeader pageKey="value-report-roi" />
        <OperatorApiProblem
          fallbackMessage={m.state.message}
          problem={m.state.problem}
          correlationId={m.state.correlationId}
        />
        <Button type="button" variant="secondary" onClick={() => void m.load()}>
          Retry
        </Button>
      </div>
    );
  }

  const { rolling30, pilotToDate } = m.state;

  return (
    <div className="mx-auto space-y-4 p-4">
      <LayerHeader pageKey="value-report-roi" />
      <DocumentLayout>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">ROI summary</h1>
        <div
          className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3 text-sm shadow-sm"
          role="status"
        >
          <p className="m-0 font-semibold text-teal-900 dark:text-teal-100">Scope</p>
          <p className="m-0 mt-1 leading-snug">Figures reflect your current tenant/workspace/project scope only.</p>
        </div>
        <p className="doc-meta m-0 text-sm text-neutral-600 dark:text-neutral-400">
          Hours-first estimate from pilot-value-report severities and pre-commit block audit events.{" "}
          <Link href="/value-report/pilot" className="font-medium text-blue-700 underline dark:text-blue-400">
            Pilot value report
          </Link>
          {" · "}
          <Link href="/governance/dashboard" className="font-medium text-blue-700 underline dark:text-blue-400">
            Workspace health
          </Link>
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <RoiTelemetryCard
            window="rolling30"
            rangeCaption={`${rolling30.report.fromUtc.slice(0, 10)} → ${rolling30.report.toUtc.slice(0, 10)} (toUtc exclusive)`}
            severity={rolling30.report.findingsBySeverity}
            precommitBlocks={rolling30.blocks.count}
            precommitBlocksExact={rolling30.blocks.exact}
            isAdmin={m.isAdmin}
          />
          <RoiTelemetryCard
            window="pilotToDate"
            rangeCaption={`${pilotToDate.report.fromUtc.slice(0, 10)} → ${pilotToDate.report.toUtc.slice(0, 10)} (toUtc exclusive)`}
            severity={pilotToDate.report.findingsBySeverity}
            precommitBlocks={pilotToDate.blocks.count}
            precommitBlocksExact={pilotToDate.blocks.exact}
            isAdmin={m.isAdmin}
          />
        </div>
      </DocumentLayout>
    </div>
  );
}
