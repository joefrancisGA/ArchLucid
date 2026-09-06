"use client";



import { cn } from "@/lib/utils";

import Link from "next/link";



import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useGovernanceDecisionsNeededSummaryQuery } from "@/hooks/use-governance-decisions-needed-summary-query";

import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";

import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor-kpi-drill-through-hrefs";

import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import {
  sponsorDecisionsNeededPresentation,
  sponsorExpiringWaiversPresentation,
  sponsorStaleArchitectureRisksPresentation,
} from "@/lib/sponsor/sponsor-queue-metric-presentations";

import {

  presentCostEvidenceFreshness,

  presentSponsorKpiCount,

} from "@/lib/sponsor-roi-kpi-display";

import {

  OPERATOR_KPI_CARD_DESCRIPTION,

  OPERATOR_KPI_CARD_TITLE,

  OPERATOR_LINK,

  OPERATOR_TYPOGRAPHY,

} from "@/lib/design-tokens";

import {

  buildSponsorServerSavingsSummary,

  resolveRunSavingsUsd,

} from "@/lib/roi-resolution-priority";

import { presentSponsorEstimatedSavings } from "@/lib/sponsor-estimated-savings-display";



export type SponsorDashboardPrimaryMetricsSectionProps = {

  readonly summary: SponsorRoiSummary | null;

  readonly loading: boolean;

};



/** Top-tier sponsor metrics: risk posture, ROI impact, governance readiness. */

export function SponsorDashboardPrimaryMetricsSection(

  props: SponsorDashboardPrimaryMetricsSectionProps,

): React.JSX.Element {

  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  const { summary, loading } = props;

  const decisionsQuery = useGovernanceDecisionsNeededSummaryQuery({ enabled: !loading });



  const decisionsNeededCount =

    loading || decisionsQuery.isError ? null : decisionsQuery.data?.totalDecisionItems ?? null;



  const staleRiskCount =

    loading || decisionsQuery.isError

      ? null

      : summary?.staleArchitectureRiskCount ?? decisionsQuery.data?.staleRisks ?? null;



  const expiringWaiversCount =

    loading || decisionsQuery.isError ? null : decisionsQuery.data?.waiversExpiringWithin14Days ?? null;



  const decisionsNeeded = presentSponsorKpiCount(

    loading ? undefined : decisionsNeededCount ?? undefined,

    { loading, suppressZeroFootnote: true },

  );

  const staleRisks = presentSponsorKpiCount(loading ? undefined : staleRiskCount ?? undefined, {

    loading,

    suppressZeroFootnote: true,

  });

  const expiringWaivers = presentSponsorKpiCount(

    loading ? undefined : expiringWaiversCount ?? undefined,

    { loading, suppressZeroFootnote: true },

  );

  const costFreshness = presentCostEvidenceFreshness({

    loading,

    status: summary?.costEvidenceFreshnessStatus,

    savingsPricingBasis: summary?.savingsPricingBasis,

    staleAfterDays: summary?.costEvidenceStaleAfterDays,

    executiveSurface: true,

  });

  const estimatedSavings = presentSponsorEstimatedSavings(

    resolveRunSavingsUsd({

      serverSummary: buildSponsorServerSavingsSummary(

        summary?.totalEstimatedUsdSavings,

        summary?.savingsPricingBasisDescription,

      ),

    })?.annualizedUsd ?? summary?.totalEstimatedUsdSavings,

    { loading, summary },

  );



  return (

    <section aria-labelledby="sponsor-primary-metrics-heading" className="space-y-3">

      <h2 id="sponsor-primary-metrics-heading" className="sr-only">

        {v.primaryMetricsSectionSrOnly}

      </h2>

      <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{v.primaryMetricsSectionTitle}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card data-testid="sponsor-primary-decisions-needed">

          <CardHeader className="pb-2">

            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>

              {v.decisionsNeededMetric.title}

            </CardTitle>

            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.decisionsNeededMetric.description}</CardDescription>

          </CardHeader>

          <CardContent>
            {loading || decisionsNeededCount === null ? (
              <p className={cn(OPERATOR_TYPOGRAPHY.executiveDashboardMetric)}>{decisionsNeeded.display}</p>
            ) : (
              <SelfDescribingMetricCount
                variant="executive"
                presentation={sponsorDecisionsNeededPresentation(decisionsNeededCount)}
                testId="sponsor-primary-decisions-needed-count"
              />
            )}
          </CardContent>

        </Card>



        <Card data-testid="sponsor-primary-risk-posture">

          <CardHeader className="pb-2">

            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>

              Risk posture

            </CardTitle>

            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>

              Stale architecture risks and waivers expiring within 14 days

            </CardDescription>

          </CardHeader>

          <CardContent className={cn("space-y-2", OPERATOR_TYPOGRAPHY.body)}>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">{v.staleArchitectureRisksMetric.title}</span>
              {loading || staleRiskCount === null ? (
                <span className="shrink-0 tabular-nums">{staleRisks.display}</span>
              ) : (
                <SelfDescribingMetricCount
                  variant="inline"
                  presentation={sponsorStaleArchitectureRisksPresentation(staleRiskCount)}
                  testId="sponsor-primary-stale-risks-count"
                />
              )}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-neutral-600 dark:text-neutral-400">{v.expiringWaiversMetric.title}</span>
              {loading || expiringWaiversCount === null ? (
                <span className="shrink-0 tabular-nums">{expiringWaivers.display}</span>
              ) : (
                <SelfDescribingMetricCount
                  variant="inline"
                  presentation={sponsorExpiringWaiversPresentation(expiringWaiversCount)}
                  testId="sponsor-primary-expiring-waivers-count"
                />
              )}
            </div>

          </CardContent>

        </Card>



        <Card data-testid="sponsor-primary-roi-impact">

          <CardHeader className="pb-2">

            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>

              Estimated savings

            </CardTitle>

            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>

              Directional portfolio impact from committed reviews

            </CardDescription>

          </CardHeader>

          <CardContent>

            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>{estimatedSavings.display}</p>

            {estimatedSavings.footnote ? (

              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{estimatedSavings.footnote}</p>

            ) : null}

          </CardContent>

        </Card>



        <Card data-testid="sponsor-primary-governance-readiness">

          <CardHeader className="pb-2">

            <CardTitle className={OPERATOR_KPI_CARD_TITLE}>

              {v.costEvidenceStatusMetric.title}

            </CardTitle>

            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{v.costEvidenceStatusMetric.description}</CardDescription>

          </CardHeader>

          <CardContent>

            <Link

              href={SPONSOR_KPI_DRILL_THROUGH.costEvidenceFreshness}

              className="block rounded-sm outline-none transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary/40"

            >

              <p className={cn("text-2xl font-semibold tabular-nums", OPERATOR_LINK.nav)}>{costFreshness.display}</p>

            </Link>

            {costFreshness.footnote ? (

              <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{costFreshness.footnote}</p>

            ) : null}

          </CardContent>

        </Card>

      </div>

    </section>

  );

}

