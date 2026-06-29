"use client";
import { cn } from "@/lib/utils";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { RoiTelemetryCard } from "@/components/RoiTelemetryCard";
import { Button } from "@/components/ui/button";

import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly model: RoiSummaryPageViewModel;
};

export function RoiSummaryPageView(props: Props) {
  const m = props.model;

  if (m.demo) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        <LayerHeader pageKey="value-report-roi" />
        <ValueReportOutcomesNav />
        <DemoWorkspaceCapabilityUnavailablePanel
          layout="embedded"
          capability="ROI summary"
          description="In a connected tenant, sponsors review review-cycle reduction, estimated effort saved, and governance-ready artifacts produced by committed reviews."
        />
      </OperatorPageContainer>
    );
  }

  if (m.state.status === "loading") {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        <LayerHeader pageKey="value-report-roi" />
        <ValueReportOutcomesNav />
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading ROI summary…</p>
      </OperatorPageContainer>
    );
  }

  if (m.state.status === "error") {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        <LayerHeader pageKey="value-report-roi" />
        <ValueReportOutcomesNav />
        <OperatorApiProblem
          fallbackMessage={m.state.message}
          problem={m.state.problem}
          correlationId={m.state.correlationId}
        />
        <Button type="button" variant="secondary" onClick={() => void m.load()}>
          Retry
        </Button>
      </OperatorPageContainer>
    );
  }

  const { rolling30, pilotToDate } = m.state;

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4">
      <LayerHeader pageKey="value-report-roi" />
      <ValueReportOutcomesNav />
      <DocumentLayout>
        <h1 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>ROI summary</h1>
        <div
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3 shadow-sm",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          <p className={cn("m-0 font-semibold text-teal-900 dark:text-teal-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Scope</p>
          <p className="m-0 mt-1 leading-snug">Figures reflect your current tenant/workspace/project scope only.</p>
        </div>
        <div
          className={cn(
            "rounded-md border border-neutral-100 bg-neutral-50 px-4 py-2 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900/40",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          role="note"
          data-testid="roi-evidence-basis-notice"
        >
          <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Evidence basis:</span>{" "}
          Figures are derived from AI-governed architecture review findings. The execution mode of each contributing
          review (Simulator or Real) is recorded on the review detail page and shown per-period on the{" "}
          <Link href="/dashboard" className={OPERATOR_LINK.nav}>
            ROI trend chart
          </Link>
          . Simulator-only periods do not represent live Azure OpenAI analysis.
        </div>
        <p className={cn("doc-meta m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Hours-first estimate from pilot-value-report severities and pre-commit block audit events.{" "}
          <Link href="/value-report/pilot" className={OPERATOR_LINK.inline}>
            Pilot value report
          </Link>
          {" · "}
          <Link href="/governance/dashboard" className={OPERATOR_LINK.inline}>
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
    </OperatorPageContainer>
  );
}
