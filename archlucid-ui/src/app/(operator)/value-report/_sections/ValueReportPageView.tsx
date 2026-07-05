"use client";

import { cn } from "@/lib/utils";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  BUYER_VALUE_REPORT_EXPORT_DISCLOSURE,
  BUYER_VALUE_REPORT_OUTCOME_LEAD,
  BUYER_VALUE_REPORT_PAGE_SUBTITLE,
  BUYER_VALUE_REPORT_PAGE_TITLE,
  BUYER_VALUE_REPORT_PERIOD_UTC_HELP,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { UseValueReportPageModel } from "./use-value-report-page";
import { ValueReportEmptyState } from "./ValueReportEmptyState";
import { ValueReportPreviewSection } from "./ValueReportPreviewSection";

type ValueReportPageViewProps = {
  model: UseValueReportPageModel;
};

export function ValueReportPageView({ model }: ValueReportPageViewProps) {
  const {
    boardBusy,
    busy,
    canDownload,
    canMutate,
    error,
    fromUtc,
    hasReportData,
    onBoardPack,
    onGenerate,
    previewBusy,
    previewMetrics,
    setFromUtc,
    setToUtc,
    toUtc,
  } = model;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const exportControls = (
    <div className="space-y-3">
      <fieldset className="m-0 space-y-2 border-0 p-0">
        <legend className={OPERATOR_TYPOGRAPHY.navLabel}>Report period</legend>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_VALUE_REPORT_PERIOD_UTC_HELP}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className={cn("flex flex-1 flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <span>From</span>
            <input
              className={cn(
                "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.body,
              )}
              type="datetime-local"
              value={fromUtc}
              onChange={(e) => setFromUtc(e.target.value)}
            />
          </label>
          <label className={cn("flex flex-1 flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <span>To</span>
            <input
              className={cn(
                "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.body,
              )}
              type="datetime-local"
              value={toUtc}
              onChange={(e) => setToUtc(e.target.value)}
            />
          </label>
          <Button type="button" disabled={!canDownload || busy} onClick={() => void onGenerate()}>
            {busy ? "Generating…" : "Sponsor report (.docx)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!canDownload || boardBusy}
            onClick={() => void onBoardPack()}
            title="Uses the current calendar quarter"
          >
            {boardBusy ? "Generating…" : "Board pack (.pdf)"}
          </Button>
        </div>
      </fieldset>
      {!canMutate ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Elevated workspace permissions required to generate sponsor reports.
        </p>
      ) : null}
      {canMutate && !hasReportData && !previewBusy ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Finalize at least one review package in this period before downloading a sponsor report.
        </p>
      ) : null}
    </div>
  );

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4 print:w-full">
      <LayerHeader pageKey="value-report" />
      <ValueReportOutcomesNav />
      <DocumentLayout>
        <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{BUYER_VALUE_REPORT_PAGE_TITLE}</h1>
        {buyerPolishedShell ? (
          <div className={cn("space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800", DESIGN_TOKENS.surface.card)}>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{BUYER_VALUE_REPORT_OUTCOME_LEAD}</p>
          </div>
        ) : (
          <p className={cn("doc-meta m-0", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_VALUE_REPORT_PAGE_SUBTITLE}</p>
        )}
        {previewBusy ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="status">
            Loading report preview…
          </p>
        ) : null}
        {!previewBusy && !hasReportData ? <ValueReportEmptyState /> : null}
        {!previewBusy && hasReportData && previewMetrics !== null ? (
          <ValueReportPreviewSection metrics={previewMetrics} />
        ) : null}
        {buyerPolishedShell ? (
          <CollapsibleSection title={BUYER_VALUE_REPORT_EXPORT_DISCLOSURE} defaultOpen={false}>
            {exportControls}
          </CollapsibleSection>
        ) : (
          exportControls
        )}
        {error ? (
          <OperatorApiProblem
            problem={error.problem}
            fallbackMessage={error.message}
            correlationId={error.correlationId}
          />
        ) : null}
      </DocumentLayout>
    </OperatorPageContainer>
  );
}
