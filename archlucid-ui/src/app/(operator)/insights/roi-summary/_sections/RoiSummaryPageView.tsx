"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { ReportSurfaceCanonicalPointerStrip } from "@/components/reports/ReportSurfaceCanonicalPointerStrip";
import { RoiSummaryBreadcrumb } from "@/components/insights/RoiSummaryBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { DocumentLayout } from "@/components/DocumentLayout";
import { LayerHeader } from "@/components/LayerHeader";
import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import { RoiSponsorExportVocabularyRail } from "@/components/RoiSponsorExportVocabularyRail";
import { ScorecardRoiVocabularyRail } from "@/components/ScorecardRoiVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { ValueReportOutcomesNav } from "@/components/usability/ValueReportOutcomesNav";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { RoiTelemetryCard } from "@/components/RoiTelemetryCard";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { useRoiLoadedHourlyUsd } from "@/hooks/use-roi-loaded-hourly-usd";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor-report-pilot-roi-measurement-help";
import { GOVERNANCE_WORKSPACE_HEALTH_HREF } from "@/lib/governance/governance-route-paths";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ROI_SUMMARY_PAGE_SUBTITLE,
  computeRoiSummaryPeriodMetrics,
  deriveRoiSummaryDataNeeds,
  formatRoiSummaryWindowTitle,
  interpretRoiSummaryMeaning,
  roiSummaryBasisOfEstimateCopy,
  roiSummaryDirectionalDisclaimer,
  roiSummaryMethodologyFormula,
  roiSummaryZeroStateBody,
  roiSummaryZeroStateHeadline,
} from "@/lib/roi-summary-sponsor-presentation";
import {
  ROI_SUMMARY_PAGE_TITLE,
  ROI_SUMMARY_PRIMARY_CONTENT_ID,
  ROI_SUMMARY_SKIP_LINK_LABEL,
} from "@/lib/roi-summary-page-copy";
import { ROI_SUMMARY_CLAIM_DISCIPLINE } from "@/lib/roi-summary-evidence-copy";
import {
  resolveRoiSummarySummarizingEmphasizedStepId,
  resolveRoiSummarySummarizingSteps,
} from "@/lib/roi-summary-summarizing-checklist";
import {
  parseRoiSummaryMethodologyOpenFromSearch,
  roiSummaryMethodologyDisclosureHrefFromSearch,
} from "@/lib/insights/roi-summary-methodology-disclosure-url";

import { RoiSummaryBuyerChrome } from "./RoiSummaryBuyerChrome";
import { RoiSummaryHeroStrip } from "./RoiSummaryHeroStrip";
import { RoiSummaryLoadedHourlyCostField } from "./RoiSummaryLoadedHourlyCostField";
import { RoiSummaryNextReviewFooterClient } from "./RoiSummaryNextReviewFooterClient";
import { RoiSummaryPickReviewBeforeSummarizingStrip } from "./RoiSummaryPickReviewBeforeSummarizingStrip";
import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

type Props = {
  readonly model: RoiSummaryPageViewModel;
};

export function RoiSummaryPageView(props: Props) {
  const m = props.model;
  const router = useRouter();
  const pathname = usePathname() ?? SPONSOR_REPORT_ROI_SUMMARY_PATH;
  const searchParams = useSearchParams();
  const roiSummaryMethodologyOpenParam = searchParams.get("roiSummaryMethodologyOpen");
  const [methodologyOpen, setMethodologyOpenState] = useState(() =>
    parseRoiSummaryMethodologyOpenFromSearch(roiSummaryMethodologyOpenParam),
  );
  const hourly = useRoiLoadedHourlyUsd();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const layerHeader = buyerPolishedShell ? null : <LayerHeader pageKey="value-report-roi" />;
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const syncMethodologyOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(roiSummaryMethodologyDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setMethodologyOpen = useCallback(
    (open: boolean) => {
      setMethodologyOpenState(open);
      syncMethodologyOpenToUrl(open);
    },
    [syncMethodologyOpenToUrl],
  );

  useEffect(() => {
    setMethodologyOpenState(parseRoiSummaryMethodologyOpenFromSearch(roiSummaryMethodologyOpenParam));
  }, [roiSummaryMethodologyOpenParam]);

  const onPickReviewForSummarizing = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${SPONSOR_REPORT_ROI_SUMMARY_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  if (m.demo) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        {layerHeader}
        <ValueReportOutcomesNav />
        <DemoWorkspaceCapabilityUnavailablePanel
          layout="embedded"
          capability="ROI summary"
          description="In a connected tenant, sponsors review review-cycle reduction, estimated effort saved, and export-ready artifacts produced by committed reviews."
        />
      </OperatorPageContainer>
    );
  }

  if (m.state.status === "loading") {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        {layerHeader}
        <ValueReportOutcomesNav />
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading ROI summaryâ€¦</p>
      </OperatorPageContainer>
    );
  }

  if (m.state.status === "error") {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        {layerHeader}
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
  const heroPeriod = { report: rolling30.report, blocks: rolling30.blocks };
  const heroMetrics = computeRoiSummaryPeriodMetrics(heroPeriod, hourly.hourlyUsd);
  const dataNeeds = deriveRoiSummaryDataNeeds(heroPeriod, hourly.hourlyUsd);
  const showZeroState = heroMetrics.hours <= 1e-9;
  const rollingWindowLabel = formatRoiSummaryWindowTitle(
    "rolling30",
    rolling30.report.fromUtc,
    rolling30.report.toUtc,
  );
  const roiSummarizingChecklistSteps = resolveRoiSummarySummarizingSteps({
    reviewPicked: scopedRunFilterActive,
    metricsReviewed: scopedRunFilterActive && !showZeroState,
    exportReady: scopedRunFilterActive && !showZeroState,
  });
  const roiSummarizingChecklistEmphasizedStepId = resolveRoiSummarySummarizingEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    metricsReviewed: scopedRunFilterActive && !showZeroState,
    exportReady: scopedRunFilterActive && !showZeroState,
  });

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4">
      {layerHeader}
      <ValueReportOutcomesNav />
      {buyerPolishedShell ? null : (
        <>
          <RoiSponsorExportVocabularyRail currentSurfaceId="roi-summary" />
          <ScorecardRoiVocabularyRail currentSurfaceId="roi-summary" />
          <BaselineRoiVocabularyRail currentSurfaceId="roi-summary" />
        </>
      )}
      <a
        href={`#${ROI_SUMMARY_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ROI_SUMMARY_SKIP_LINK_LABEL}
      </a>
      <DocumentLayout>
        <div
          id={ROI_SUMMARY_PRIMARY_CONTENT_ID}
          data-testid="roi-summary-primary-content"
          className="scroll-mt-24 space-y-4"
        >
          <OperatorPageHeader
            navHref={SPONSOR_REPORT_ROI_SUMMARY_PATH}
            title={ROI_SUMMARY_PAGE_TITLE}
            headingLevel="h1"
            breadcrumb={buyerPolishedShell ? <RoiSummaryBreadcrumb /> : undefined}
            subtitle={buyerPolishedShell ? ROI_SUMMARY_PAGE_SUBTITLE : null}
            claimDiscipline={ROI_SUMMARY_CLAIM_DISCIPLINE}
            claimDisciplineTestId="roi-summary-claim-discipline"
            actions={
              buyerPolishedShell ? (
                <PageContextualHelpButton />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <PageContextualHelpButton />
                  <nav
                    aria-label="Related value reports"
                    className={cn(
                      "flex flex-wrap items-center gap-x-3 gap-y-1 text-al-text-secondary",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                  >
                    <Link href={SPONSOR_REPORT_PATH} className={OPERATOR_LINK.inline}>
                      {SPONSOR_REPORT_PAGE_TITLE}
                    </Link>
                    <Link href="/administration/baseline" className={OPERATOR_LINK.inline}>
                      Baseline settings
                    </Link>
                    <Link href={GOVERNANCE_WORKSPACE_HEALTH_HREF} className={OPERATOR_LINK.inline}>
                      Workspace health
                    </Link>
                  </nav>
                </div>
              )
            }
          />

          <ReportSurfaceCanonicalPointerStrip surfaceId="roi-summary" />

          {!scopedRunFilterActive ? (
            <RoiSummaryPickReviewBeforeSummarizingStrip
              selectedReviewId={scopedRunId}
              onSelectReview={onPickReviewForSummarizing}
            />
          ) : (
            <IntegrationConnectChecklist
              title="Summarizing checklist"
              steps={roiSummarizingChecklistSteps}
              emphasizedStepId={roiSummarizingChecklistEmphasizedStepId}
              testIdPrefix="roi-summary-summarizing"
            />
          )}

          {scopedRunFilterActive ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="roi-summary-run-scope-banner"
            >
              {"Summarizing ROI for review "}
              <span className="font-mono text-al-text-primary">{scopedRunId}</span>
              {" · "}
              <Link className={OPERATOR_LINK.inline} href={SPONSOR_REPORT_ROI_SUMMARY_PATH}>
                Clear review scope
              </Link>
              {" · "}
              <Link
                className={OPERATOR_LINK.inline}
                href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
              >
                Open review
              </Link>
            </p>
          ) : null}

          {scopedRunFilterActive ? (
            <>
              <RoiSummaryHeroStrip
                period={heroPeriod}
                hourlyUsd={hourly.hourlyUsd}
                windowLabel={rollingWindowLabel}
                isDefaultRate={hourly.isDefaultRate}
              />

        {showZeroState ? (
          <section
            className={cn(DESIGN_TOKENS.callout.warn, "rounded-lg p-4")}
            data-testid="roi-summary-zero-state"
          >
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{roiSummaryZeroStateHeadline()}</h2>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{roiSummaryZeroStateBody()}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/architecture/reviews/new">{BUYER_START_ARCHITECTURE_REVIEW_CTA}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={SPONSOR_REPORT_PATH}>Open sample sponsor report</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF}>Review methodology</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby="roi-summary-what-this-means-heading"
          className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
          data-testid="roi-summary-what-this-means"
        >
          <h2 id="roi-summary-what-this-means-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            What this means
          </h2>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {interpretRoiSummaryMeaning(heroMetrics, hourly.hourlyUsd, {
              isDefaultRate: hourly.isDefaultRate,
            })}
          </p>
        </section>

        <section
          aria-labelledby="roi-summary-basis-heading"
          className="rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
          data-testid="roi-summary-basis-of-estimate"
        >
          <h2 id="roi-summary-basis-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Basis of estimate
          </h2>
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {roiSummaryBasisOfEstimateCopy()}
          </p>
        </section>

        {m.isAdmin ? (
          <RoiSummaryLoadedHourlyCostField
            hourlyUsd={hourly.hourlyUsd}
            mounted={hourly.mounted}
            isDefaultRate={hourly.isDefaultRate}
            onHourlyUsdChange={hourly.setHourlyUsd}
          />
        ) : null}

        <section
          aria-labelledby="roi-summary-data-needs-heading"
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          data-testid="roi-summary-data-needs"
        >
          <h2 id="roi-summary-data-needs-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            What is needed
          </h2>
          <ul className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {dataNeeds.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-al-text-secondary">
                <span aria-hidden="true">{item.met ? "âœ“" : "â—‹"}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <CollapsibleSection
          title="Methodology"
          sectionTestId="roi-summary-methodology"
          open={methodologyOpen}
          onToggle={setMethodologyOpen}
        >
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Estimated hours saved use a directional weighting model: {roiSummaryMethodologyFormula()}.
          </p>
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Dollar value multiplies estimated hours by your loaded hourly cost. Figures reflect your current tenant,
            workspace, and project scope only.
          </p>
          <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <Link href={SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF} className={OPERATOR_LINK.inline}>
              Review full methodology
            </Link>
          </p>
        </CollapsibleSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <RoiTelemetryCard
            window="rolling30"
            period={heroPeriod}
            hourlyUsd={hourly.hourlyUsd}
            isDefaultRate={hourly.isDefaultRate}
          />
          <RoiTelemetryCard
            window="pilotToDate"
            period={{ report: pilotToDate.report, blocks: pilotToDate.blocks }}
            hourlyUsd={hourly.hourlyUsd}
            isDefaultRate={hourly.isDefaultRate}
          />
        </div>

        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
          {roiSummaryDirectionalDisclaimer()}
        </p>

          <RoiSummaryBuyerChrome />

          <RoiSummaryNextReviewFooterClient runId={scopedRunId} />
            </>
          ) : null}
        </div>
      </DocumentLayout>
    </OperatorPageContainer>
  );
}

