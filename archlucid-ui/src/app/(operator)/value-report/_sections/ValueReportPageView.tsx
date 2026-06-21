"use client";

import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  BUYER_VALUE_REPORT_EXPORT_DISCLOSURE,
  BUYER_VALUE_REPORT_OUTCOME_DETAILS,
  BUYER_VALUE_REPORT_OUTCOME_LEAD,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { UseValueReportPageModel } from "./use-value-report-page";

type ValueReportPageViewProps = {
  model: UseValueReportPageModel;
};

export function ValueReportPageView({ model }: ValueReportPageViewProps) {
  const {
    boardBusy,
    busy,
    canMutate,
    error,
    fromUtc,
    onBoardPack,
    onGenerate,
    setFromUtc,
    setToUtc,
    toUtc,
  } = model;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const exportControls = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span>From (UTC)</span>
          <input
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            type="datetime-local"
            value={fromUtc}
            onChange={(e) => setFromUtc(e.target.value)}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span>To (UTC)</span>
          <input
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            type="datetime-local"
            value={toUtc}
            onChange={(e) => setToUtc(e.target.value)}
          />
        </label>
        <Button type="button" disabled={!canMutate || busy} onClick={() => void onGenerate()}>
          {busy ? "Generating…" : "Download DOCX"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canMutate || boardBusy}
          onClick={() => void onBoardPack()}
          title="Uses the current UTC calendar quarter"
        >
          {boardBusy ? "Board pack…" : "Quarterly board pack (PDF)"}
        </Button>
      </div>
      {!canMutate ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Operator or Administrator role required — the API enforces elevated permissions for this report.
        </p>
      ) : null}
    </>
  );

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4 print:w-full">
      <LayerHeader pageKey="value-report" />
      <ValueReportOutcomesNav />
      <DocumentLayout>
        <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Value report</h1>
        {buyerPolishedShell ? (
          <div className={cn("space-y-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800", DESIGN_TOKENS.surface.card)}>
            <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">{BUYER_VALUE_REPORT_OUTCOME_LEAD}</p>
            <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {BUYER_VALUE_REPORT_OUTCOME_DETAILS}
            </p>
          </div>
        ) : (
          <p className="doc-meta m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Generates a stakeholder-grade DOCX from finalized reviews, governance and drift audit counts, and ROI_MODEL-aligned
            estimates for the selected UTC window. Requires{" "}
            <strong className="font-medium text-neutral-800 dark:text-neutral-200">Standard</strong> commercial tier on the
            API.
          </p>
        )}
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
