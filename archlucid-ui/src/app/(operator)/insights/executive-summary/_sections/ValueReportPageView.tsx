"use client";

import { cn } from "@/lib/utils";
import { useCallback } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { firstWhyDisabledCtaReason, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import {
  BUYER_VALUE_REPORT_DEMO_SAMPLE_NOTE,
  BUYER_VALUE_REPORT_EXPORT_DISABLED_HELP,
  BUYER_VALUE_REPORT_HOW_IT_WORKS_DETAILS,
  BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE,
  BUYER_VALUE_REPORT_OUTCOME_LEAD,
  BUYER_VALUE_REPORT_PAGE_SUBTITLE,
  BUYER_VALUE_REPORT_PAGE_TITLE,
  BUYER_VALUE_REPORT_PERIOD_EXPORTS_TITLE,
  BUYER_VALUE_REPORT_PERIOD_UTC_HELP,
} from "@/lib/buyer/buyer-polish-copy";
import { isNextPublicDemoMode, isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";

import type { UseValueReportPageModel } from "./use-value-report-page";
import { ValueReportEmptyState } from "./ValueReportEmptyState";
import { ValueReportIncludesSection } from "./ValueReportIncludesSection";
import { ValueReportPreviewSection } from "./ValueReportPreviewSection";

type ValueReportPageViewProps = {
  model: UseValueReportPageModel;
};

function exportDisabledReason(
  canMutate: boolean,
  hasReportData: boolean,
  previewBusy: boolean,
): WhyDisabledCtaReason | null {
  return firstWhyDisabledCtaReason([
    canMutate
      ? null
      : {
          kind: "role",
          message: "Elevated workspace permissions required to generate sponsor reports.",
        },
    !hasReportData && !previewBusy
      ? {
          kind: "prerequisite",
          message: BUYER_VALUE_REPORT_EXPORT_DISABLED_HELP,
        }
      : null,
    previewBusy
      ? {
          kind: "lifecycle",
          message: "Refresh the preview after updating the report period.",
        }
      : null,
  ]);
}

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
    onRefreshPreview,
    previewBusy,
    previewMetrics,
    setFromUtc,
    setToUtc,
    toUtc,
  } = model;

  const disabledReason = exportDisabledReason(canMutate, hasReportData, previewBusy);
  const exportDisabledHintId = "value-report-export-disabled-reason";
  const showDemoSampleNote = isNextPublicDemoMode();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const scrollToPreview = useCallback(() => {
    document.getElementById("value-report-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4 print:w-full">
      {buyerPolishedShell ? null : <LayerHeader pageKey="value-report" />}
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <PageContextualHelpButton />
      </div>
      <ValueReportOutcomesNav />
<DocumentLayout>
        <header className="space-y-2">
          <h1 className={`m-0 ${OPERATOR_TYPOGRAPHY.pageTitle}`}>{BUYER_VALUE_REPORT_PAGE_TITLE}</h1>
          {buyerPolishedShell ? (
            <>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {BUYER_VALUE_REPORT_PAGE_SUBTITLE}
              </p>
              <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {BUYER_VALUE_REPORT_OUTCOME_LEAD}
              </p>
            </>
          ) : null}
        </header>

        <CollapsibleSection title={BUYER_VALUE_REPORT_HOW_IT_WORKS_TITLE} defaultOpen={false} sectionTestId="value-report-how-it-works">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{BUYER_VALUE_REPORT_HOW_IT_WORKS_DETAILS}</p>
        </CollapsibleSection>

        <section
          className={cn("space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800", DESIGN_TOKENS.surface.card)}
          data-testid="value-report-export-panel"
          aria-labelledby="value-report-export-heading"
        >
          <div className="space-y-1">
            <h2 id="value-report-export-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {BUYER_VALUE_REPORT_PERIOD_EXPORTS_TITLE}
            </h2>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_VALUE_REPORT_PERIOD_UTC_HELP}</p>
          </div>

          <fieldset className="m-0 space-y-3 border-0 p-0">
            <legend className="sr-only">Report period</legend>
            <div className="flex flex-wrap items-end gap-3">
              <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-medium text-al-text-primary">{OPERATOR_DATE_RANGE_START_LABEL}</span>
                <input
                  className={cn(
                    "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.body,
                    OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
                  )}
                  type="datetime-local"
                  value={fromUtc}
                  onChange={(e) => setFromUtc(e.target.value)}
                />
              </label>
              <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-medium text-al-text-primary">{OPERATOR_DATE_RANGE_END_LABEL}</span>
                <input
                  className={cn(
                    "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.body,
                    OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
                  )}
                  type="datetime-local"
                  value={toUtc}
                  onChange={(e) => setToUtc(e.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={previewBusy} onClick={() => void onRefreshPreview()}>
                {previewBusy ? "Refreshing…" : "Refresh preview"}
              </Button>
              {hasReportData && !previewBusy ? (
                <Button type="button" variant="outline" onClick={scrollToPreview}>
                  Preview report
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={!canDownload || busy}
                aria-describedby={disabledReason === null ? undefined : exportDisabledHintId}
                onClick={() => void onGenerate()}
              >
                {busy ? "Generating…" : "Export sponsor report (.docx)"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canDownload || boardBusy}
                aria-describedby={disabledReason === null ? undefined : exportDisabledHintId}
                aria-label={
                  boardBusy
                    ? "Generating board pack"
                    : "Export board pack (.pdf). Uses the current calendar quarter."
                }
                onClick={() => void onBoardPack()}
              >
                {boardBusy ? "Generating…" : "Export board pack (.pdf)"}
              </Button>
            </div>
          </fieldset>
          <WhyDisabledCtaHint
            id={exportDisabledHintId}
            reason={disabledReason}
            testId={exportDisabledHintId}
          />
        </section>

        {showDemoSampleNote ? (
          <p className={cn("m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)} data-testid="value-report-demo-note">
            {BUYER_VALUE_REPORT_DEMO_SAMPLE_NOTE}{" "}
            <a href="/insights/pilot-outcomes" className="text-teal-700 underline underline-offset-2 dark:text-teal-300">
              View sample value report
            </a>
            .
          </p>
        ) : null}

        <ValueReportIncludesSection />

        {previewBusy ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="status">
            Loading report preview…
          </p>
        ) : null}

        {!previewBusy && !hasReportData ? <ValueReportEmptyState /> : null}

        {!previewBusy && hasReportData && previewMetrics !== null ? (
          <ValueReportPreviewSection metrics={previewMetrics} />
        ) : null}

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
