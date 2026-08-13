"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_PAGE_TITLE,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
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

import { RoiSummaryHeroStrip } from "./RoiSummaryHeroStrip";
import { RoiSummaryLoadedHourlyCostField } from "./RoiSummaryLoadedHourlyCostField";
import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

type Props = {
  readonly model: RoiSummaryPageViewModel;
};

export function RoiSummaryPageView(props: Props) {
  const m = props.model;
  const hourly = useRoiLoadedHourlyUsd();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const layerHeader = buyerPolishedShell ? null : <LayerHeader pageKey="value-report-roi" />;

  if (m.demo) {
    return (
      <OperatorPageContainer variant="dashboard" className="space-y-4">
        {layerHeader}
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

  return (
    <OperatorPageContainer variant="dashboard" className="space-y-4">
      {layerHeader}
      <ValueReportOutcomesNav />
      <RoiSponsorExportVocabularyRail currentSurfaceId="roi-summary" />
      <ScorecardRoiVocabularyRail currentSurfaceId="roi-summary" />
      <BaselineRoiVocabularyRail currentSurfaceId="roi-summary" />
      <DocumentLayout>
        <OperatorPageHeader
          navHref={SPONSOR_REPORT_ROI_SUMMARY_PATH}
          title="ROI summary"
          headingLevel="h1"
          subtitle={buyerPolishedShell ? ROI_SUMMARY_PAGE_SUBTITLE : null}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <PageContextualHelpButton />
              <nav
                aria-label="Related value reports"
                className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
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
          }
        />

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

        <CollapsibleSection title="Methodology" sectionTestId="roi-summary-methodology">
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
      </DocumentLayout>
    </OperatorPageContainer>
  );
}

