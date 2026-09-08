"use client";

import { Download, FileText } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AiComparisonExplanationView } from "@/components/compare/AiComparisonExplanationView";
import { CompareRawManifestDiffSection } from "@/components/compare/CompareRawManifestDiffSection";
import { CompareResultsSectionNav } from "@/components/compare/CompareResultsSectionNav";
import { LegacyRunComparisonView } from "@/components/compare/LegacyRunComparisonView";
import { StructuredComparisonView } from "@/components/compare/StructuredComparisonView";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL } from "@/lib/buyer/buyer-polish-copy";
import {
  compareSponsorNarrativeDisclosureHrefFromSearch,
  parseCompareSponsorNarrativeOpenFromSearch,
} from "@/lib/insights/compare-sponsor-narrative-disclosure-url";
import {
  compareTechnicalAppendixDisclosureHrefFromSearch,
  parseCompareTechnicalAppendixOpenFromSearch,
} from "@/lib/insights/compare-technical-appendix-disclosure-url";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { CompareFindingCorrelationSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationSection";
import { CompareGovernanceDiffSection } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffSection";
import { ComparePairEvidenceCiteStrip } from "@/app/(operator)/insights/compare-two-reviews/_sections/ComparePairEvidenceCiteStrip";
import { CompareExecutionModeHonestyStrip } from "@/components/compare/CompareExecutionModeHonestyStrip";
import type { CompareResultsPanelViewModel } from "@/app/(operator)/insights/compare-two-reviews/_sections/use-compare-results-panel";

export function CompareResultsPanelDiffStack({
  viewModel,
}: {
  readonly viewModel: CompareResultsPanelViewModel;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const compareTechnicalAppendixOpenParam = searchParams.get("compareTechnicalAppendixOpen");
  const compareSponsorNarrativeOpenParam = searchParams.get("compareSponsorNarrativeOpen");
  const [technicalAppendixOpen, setTechnicalAppendixOpenState] = useState(() =>
    parseCompareTechnicalAppendixOpenFromSearch(compareTechnicalAppendixOpenParam),
  );
  const [sponsorNarrativeOpen, setSponsorNarrativeOpenState] = useState(() =>
    parseCompareSponsorNarrativeOpenFromSearch(compareSponsorNarrativeOpenParam),
  );

  const syncTechnicalAppendixOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        compareTechnicalAppendixDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setTechnicalAppendixOpen = useCallback(
    (open: boolean) => {
      setTechnicalAppendixOpenState(open);
      syncTechnicalAppendixOpenToUrl(open);
    },
    [syncTechnicalAppendixOpenToUrl],
  );

  const syncSponsorNarrativeOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        compareSponsorNarrativeDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setSponsorNarrativeOpen = useCallback(
    (open: boolean) => {
      setSponsorNarrativeOpenState(open);
      syncSponsorNarrativeOpenToUrl(open);
    },
    [syncSponsorNarrativeOpenToUrl],
  );

  useEffect(() => {
    setTechnicalAppendixOpenState(parseCompareTechnicalAppendixOpenFromSearch(compareTechnicalAppendixOpenParam));
  }, [compareTechnicalAppendixOpenParam]);

  useEffect(() => {
    setSponsorNarrativeOpenState(parseCompareSponsorNarrativeOpenFromSearch(compareSponsorNarrativeOpenParam));
  }, [compareSponsorNarrativeOpenParam]);

  const {
    hasResultsToNavigate,
    golden,
    result,
    aiExplanation,
    comparisonNarrative,
    comparisonNarrativeLoading,
    buyerPolished = false,
    leftPickedSummary,
    rightPickedSummary,
    citeBaselineRunId,
    citeUpdatedRunId,
    showPairCiteStrip,
    showExecutionModeHonesty,
    governanceDiffState,
    verdictSummary,
    docxHref,
    pdfDownloading,
    pdfError,
    handleDownloadPdf,
  } = viewModel;

  return (
    <>
      {hasResultsToNavigate ? (
        <div
          className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
          data-testid="compare-results-action-bar"
        >
          <CompareResultsSectionNav
            showStructured={golden !== null}
            showFindingCorrelation={golden !== null}
            showGovernanceDiff={golden !== null}
            showRawManifestDiff={golden !== null}
            showTechnicalAppendix={result !== null}
            showAiExplanation={aiExplanation !== null}
            buyerPolished={buyerPolished}
            className="flex-1"
          />
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row lg:items-end">
            {docxHref !== null ? (
              <a
                href={docxHref}
                rel="noreferrer"
                className={cn(OPERATOR_LINK.inline, "inline-flex items-center gap-1.5 text-sm")}
                data-testid="compare-download-docx-button"
              >
                <FileText className="h-4 w-4" aria-hidden />
                Download DOCX package
              </a>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfDownloading}
              data-testid="compare-download-pdf-button"
            >
              <Download className="h-4 w-4" aria-hidden focusable={false} />
              {pdfDownloading ? "Generating PDF…" : "Download PDF report"}
            </Button>
            {pdfError ? (
              <p role="alert" className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)}>
                {pdfError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showPairCiteStrip ? (
        <ComparePairEvidenceCiteStrip baselineRunId={citeBaselineRunId} updatedRunId={citeUpdatedRunId} />
      ) : null}

      <ClientErrorBoundary title="Comparison results failed to render">
        {showExecutionModeHonesty ? (
          <CompareExecutionModeHonestyStrip
            baselineRunId={citeBaselineRunId}
            updatedRunId={citeUpdatedRunId}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
          />
        ) : null}

        {comparisonNarrativeLoading ? (
          <OperatorLoadingNotice>
            <strong>Generating comparison narrative.</strong>
          </OperatorLoadingNotice>
        ) : null}

        {comparisonNarrative !== null ? (
          <div
            className={cn(
              "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3 leading-relaxed",
              OPERATOR_TYPOGRAPHY.body,
            )}
            role="status"
            data-testid="compare-ask-narrative-banner"
          >
            <p className={cn("m-0 mb-1 uppercase tracking-wide text-al-text-secondary dark:text-neutral-200", OPERATOR_NAV_GROUP_LABEL)}>
              ✦ AI narrative
            </p>
            <p className="m-0 whitespace-pre-wrap">{comparisonNarrative}</p>
          </div>
        ) : null}

        {golden !== null && (
          <StructuredComparisonView
            golden={golden}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
            buyerCompareUi={buyerPolished}
            summaryHighlightsForFold={verdictSummary?.summaryHighlightsForFold}
          />
        )}

        {golden !== null ? (
          <CompareFindingCorrelationSection baselineRunId={golden.baseRunId} targetRunId={golden.targetRunId} />
        ) : null}

        {golden !== null ? (
          <CompareGovernanceDiffSection
            baselineRunId={golden.baseRunId}
            targetRunId={golden.targetRunId}
            preloaded={governanceDiffState}
            baselineRequestId={leftPickedSummary?.requestId}
            targetRequestId={rightPickedSummary?.requestId}
          />
        ) : null}

        {golden !== null ? (
          <CompareRawManifestDiffSection
            baselineRunId={golden.baseRunId}
            updatedRunId={golden.targetRunId}
            baselinePickedSummary={leftPickedSummary}
            updatedPickedSummary={rightPickedSummary}
            buyerPolished={buyerPolished}
          />
        ) : null}

        {result !== null ? (
          <details
            id="compare-technical"
            className="group mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-600 dark:bg-neutral-900/30"
            open={technicalAppendixOpen}
            onToggle={(event) => {
              setTechnicalAppendixOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
            <summary className={cn("flex cursor-pointer items-center gap-2 text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              <DisclosureTriangleIndicator />
              <h2 className={cn("m-0 inline text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {buyerPolished ? BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL : "Technical details — supplementary review-level comparison"}
              </h2>
            </summary>
            <div className="mt-4">
              <LegacyRunComparisonView result={result} />
            </div>
          </details>
        ) : null}

        {aiExplanation !== null ? (
          <details
            id="compare-ai"
            className="group mt-6 rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
            open={sponsorNarrativeOpen}
            onToggle={(event) => {
              setSponsorNarrativeOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
            <summary className={cn("flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-al-text-primary outline-none ring-offset-2 marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] [&::-webkit-details-marker]:hidden", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
              <DisclosureTriangleIndicator />
              <h2 className={cn("m-0 inline text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                Sponsor narrative (AI-generated)
              </h2>
            </summary>
            <div className="border-t border-neutral-200 px-4 pb-2 dark:border-neutral-700">
              <AiComparisonExplanationView explanation={aiExplanation} />
            </div>
          </details>
        ) : null}
      </ClientErrorBoundary>
    </>
  );
}
