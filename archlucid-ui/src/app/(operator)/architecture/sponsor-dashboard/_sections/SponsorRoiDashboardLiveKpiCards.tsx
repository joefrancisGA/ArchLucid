"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useSponsorRoiSummaryQuery } from "@/hooks/use-sponsor-roi-summary-query";
import { useGovernanceDecisionsNeededSummaryQuery } from "@/hooks/use-governance-decisions-needed-summary-query";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { KpiTileDrillThroughLink } from "@/components/KpiTileDrillThroughLink";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor-kpi-drill-through-hrefs";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import {
  presentCostEvidenceFreshness,
  presentSponsorKpiCount,
} from "@/lib/sponsor-roi-kpi-display";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { computePilotDayNumber } from "@/lib/sponsor-pilot-day";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  sponsorDecisionsNeededPresentation,
  sponsorExpiringWaiversPresentation,
  sponsorNewlyDiscoveredFindingsPresentation,
  sponsorStaleArchitectureRisksPresentation,
} from "@/lib/sponsor/sponsor-queue-metric-presentations";

function KpiFootnote(props: { readonly text: string | null; readonly runbookHref?: string | null }) {
  if (!props.text) {
    return null;
  }

  return (
    <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      {props.text}
      {props.runbookHref ? (
        <>
          {" "}
          <Link href={toDocsBlobUrl(props.runbookHref)} className="underline">
            Runbook
          </Link>
        </>
      ) : null}
    </p>
  );
}

/** Live KPI tiles for `/dashboard` backed by ROI and governance stickiness APIs (TB-062). */
export type SponsorRoiDashboardLiveKpiCardsProps = {
  readonly summary?: SponsorRoiSummary | null;
  readonly loading?: boolean;
  /** `sponsor-details` omits primary-strip metrics and suppresses repeated zero footnotes. */
  readonly variant?: "full" | "sponsor-details";
};

export function SponsorRoiDashboardLiveKpiCards({
  summary: summaryProp,
  loading: loadingProp,
  variant = "full",
}: SponsorRoiDashboardLiveKpiCardsProps = {}) {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;
  const executiveDetails = variant === "sponsor-details";
  const suppressZeroFootnote = executiveDetails;
  const usesExternalSummary = summaryProp !== undefined || loadingProp !== undefined;
  const summaryQuery = useSponsorRoiSummaryQuery({ enabled: !usesExternalSummary });
  const decisionsQuery = useGovernanceDecisionsNeededSummaryQuery({
    enabled: usesExternalSummary ? loadingProp !== true : true,
  });

  const resolvedSummary = usesExternalSummary ? (summaryProp ?? null) : (summaryQuery.data ?? null);
  const summaryFailure =
    !usesExternalSummary && summaryQuery.isError ? toApiLoadFailure(summaryQuery.error) : null;
  const failure: ApiLoadFailureState | null =
    decisionsQuery.isError ? toApiLoadFailure(decisionsQuery.error) : null;

  const loading = usesExternalSummary
    ? (loadingProp ?? false) || decisionsQuery.isPending
    : summaryQuery.isPending || decisionsQuery.isPending;

  const staleRiskCount =
    resolvedSummary?.staleArchitectureRiskCount ?? decisionsQuery.data?.staleRisks ?? 0;
  const expiringWaiversCount = decisionsQuery.data?.waiversExpiringWithin14Days ?? 0;
  const decisionsNeededCount = decisionsQuery.data?.totalDecisionItems ?? 0;

  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  if (summaryFailure !== null) {
    return (
      <div className="sm:col-span-2 lg:col-span-3">
        <OperatorApiProblem failure={summaryFailure} />
      </div>
    );
  }

  if (failure) {
    return (
      <div className="sm:col-span-2 lg:col-span-3">
        <OperatorApiProblem failure={failure} />
      </div>
    );
  }

  const resolved = presentSponsorKpiCount(resolvedSummary?.resolvedFindingsCount30Days, {
    loading,
    suppressZeroFootnote,
  });
  const discovered = presentSponsorKpiCount(resolvedSummary?.newlyDiscoveredFindingsCount30Days, {
    loading,
    suppressZeroFootnote,
  });
  const remediated = presentSponsorKpiCount(resolvedSummary?.realizedValue?.findingsRemediatedCount30Days, {
    loading,
    suppressZeroFootnote,
  });
  const staleRisks = presentSponsorKpiCount(loading ? undefined : staleRiskCount, {
    loading,
    suppressZeroFootnote,
  });
  const expiringWaivers = presentSponsorKpiCount(loading ? undefined : expiringWaiversCount, {
    loading,
    suppressZeroFootnote,
  });
  const decisionsNeeded = presentSponsorKpiCount(loading ? undefined : decisionsNeededCount, {
    loading,
    suppressZeroFootnote,
  });
  const costFreshness = presentCostEvidenceFreshness({
    loading,
    status: resolvedSummary?.costEvidenceFreshnessStatus,
    savingsPricingBasis: resolvedSummary?.savingsPricingBasis,
    staleAfterDays: resolvedSummary?.costEvidenceStaleAfterDays,
    executiveSurface: executiveDetails || buyerPolished,
  });
  const pilotDayNumber = computePilotDayNumber(resolvedSummary?.firstCommitUtc);

  return (
    <>
      {pilotDayNumber !== null && !buyerPolished ? (
        <p
          className={cn("m-0 text-al-text-secondary sm:col-span-2 lg:col-span-3", OPERATOR_TYPOGRAPHY.body)}
          data-testid="exec-kpi-pilot-day-badge"
        >
          Day {pilotDayNumber} of your ArchLucid pilot
        </p>
      ) : null}
      <Card data-testid="exec-kpi-resolved-30d">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {v.resolvedFindings30dMetric.title}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {v.resolvedFindings30dMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={SPONSOR_KPI_DRILL_THROUGH.resolvedFindings30d}
            testId="kpi-tile-resolved-30d-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {resolved.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={resolved.footnote} />
        </CardContent>
      </Card>

      <Card data-testid="exec-kpi-discovered-30d">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {v.newlyDiscoveredFindings30dMetric.title}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {v.newlyDiscoveredFindings30dMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>{discovered.display}</p>
          ) : (
            <SelfDescribingMetricCount
              variant="executive"
              presentation={sponsorNewlyDiscoveredFindingsPresentation(
                resolvedSummary?.newlyDiscoveredFindingsCount30Days ?? 0,
              )}
              testId="exec-kpi-discovered-30d-count"
            />
          )}
          <KpiFootnote text={discovered.footnote} />
        </CardContent>
      </Card>

      {!executiveDetails ? (
      <Card data-testid="exec-kpi-stale-risks">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {v.staleArchitectureRisksMetric.title}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {v.staleArchitectureRisksMetric.description}{" "}
            <Link href="/governance/findings" className="underline">
              Findings
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>{staleRisks.display}</p>
          ) : (
            <SelfDescribingMetricCount
              variant="executive"
              presentation={sponsorStaleArchitectureRisksPresentation(staleRiskCount)}
              testId="exec-kpi-stale-risks-count"
            />
          )}
          <KpiFootnote text={staleRisks.footnote} />
        </CardContent>
      </Card>
      ) : null}

      {!executiveDetails ? (
        <>
      <Card data-testid="exec-kpi-decisions-needed">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {v.decisionsNeededMetric.title}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {v.decisionsNeededMetric.description}{" "}
            <Link href="/governance/findings" className="underline">
              Findings
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>{decisionsNeeded.display}</p>
          ) : (
            <SelfDescribingMetricCount
              variant="executive"
              presentation={sponsorDecisionsNeededPresentation(decisionsNeededCount)}
              testId="exec-kpi-decisions-needed-count"
            />
          )}
          <KpiFootnote text={decisionsNeeded.footnote} />
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1" data-testid="exec-kpi-expiring-waivers">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {v.expiringWaiversMetric.title}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {v.expiringWaiversMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>{expiringWaivers.display}</p>
          ) : (
            <SelfDescribingMetricCount
              variant="executive"
              presentation={sponsorExpiringWaiversPresentation(expiringWaiversCount)}
              testId="exec-kpi-expiring-waivers-count"
            />
          )}
          <KpiFootnote text={expiringWaivers.footnote} />
        </CardContent>
      </Card>
        </>
      ) : null}

      <Card data-testid="exec-kpi-remediated-30d">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {buyerPolished ? v.findingsRemediated30dMetric.title : "Findings remediated (30d)"}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {buyerPolished
              ? v.findingsRemediated30dMetric.description
              : "Computed from disposition workflow evidence"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={SPONSOR_KPI_DRILL_THROUGH.findingsRemediated30d}
            testId="kpi-tile-remediated-30d-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {remediated.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={remediated.footnote} />
        </CardContent>
      </Card>

      {!executiveDetails ? (
      <Card data-testid="exec-kpi-cost-evidence-freshness">
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_KPI_CARD_TITLE}>
            {v.costEvidenceStatusMetric.title}
          </CardTitle>
          <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
            {v.costEvidenceStatusMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={SPONSOR_KPI_DRILL_THROUGH.costEvidenceFreshness}
            testId="kpi-tile-cost-evidence-freshness-link"
          >
            <p className="font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
              {costFreshness.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={costFreshness.footnote} runbookHref={costFreshness.runbookHref} />
        </CardContent>
      </Card>
      ) : null}
    </>
  );
}
