"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { KpiTileDrillThroughLink } from "@/components/KpiTileDrillThroughLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EXECUTIVE_KPI_DRILL_THROUGH } from "@/lib/executive-kpi-drill-through-hrefs";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { getGovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import {
  presentCostEvidenceFreshness,
  presentExecutiveKpiCount,
} from "@/lib/executive-roi-kpi-display";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { computePilotDayNumber } from "@/lib/executive-pilot-day";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type LiveKpiState = {
  summary: ExecutiveRoiSummary | null;
  staleRiskCount: number;
  expiringWaiversCount: number;
  decisionsNeededCount: number;
};

function KpiFootnote(props: { readonly text: string | null; readonly runbookHref?: string | null }) {
  if (!props.text) {
    return null;
  }

  return (
    <p className="m-0 mt-2 text-xs text-neutral-600 dark:text-neutral-400">
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
export type ExecutiveRoiDashboardLiveKpiCardsProps = {
  readonly summary?: ExecutiveRoiSummary | null;
  readonly loading?: boolean;
};

export function ExecutiveRoiDashboardLiveKpiCards({
  summary: summaryProp,
  loading: loadingProp,
}: ExecutiveRoiDashboardLiveKpiCardsProps = {}) {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const usesExternalSummary = summaryProp !== undefined || loadingProp !== undefined;
  const [state, setState] = useState<LiveKpiState>({
    summary: summaryProp ?? null,
    staleRiskCount: 0,
    expiringWaiversCount: 0,
    decisionsNeededCount: 0,
  });
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(loadingProp ?? true);

  useEffect(() => {
    if (usesExternalSummary) {
      setState((current) => ({
        ...current,
        summary: summaryProp ?? null,
        staleRiskCount: summaryProp?.staleArchitectureRiskCount ?? current.staleRiskCount,
      }));
      setLoading(loadingProp ?? false);
      setFailure(null);

      if (loadingProp) {
        return undefined;
      }
    }

    let cancelled = false;

    void (async () => {
      try {
        const summaryPromise = usesExternalSummary
          ? Promise.resolve(summaryProp ?? null)
          : fetchExecutiveRoiSummaryClient();
        const [summary, decisionsNeeded] = await Promise.all([
          summaryPromise,
          getGovernanceDecisionsNeededSummary(),
        ]);

        if (!cancelled) {
          setState({
            summary,
            staleRiskCount:
              summary?.staleArchitectureRiskCount ?? decisionsNeeded.staleRisks,
            // TB-155 / EXECUTIVE_KPI_SEMANTIC_CONTRACT: live governance count only (not cached ROI).
            expiringWaiversCount: decisionsNeeded.waiversExpiringWithin14Days,
            decisionsNeededCount: decisionsNeeded.totalDecisionItems,
          });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setFailure(toApiLoadFailure(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadingProp, summaryProp, usesExternalSummary]);

  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  if (failure) {
    return (
      <div className="sm:col-span-2 lg:col-span-3">
        <OperatorApiProblem failure={failure} />
      </div>
    );
  }

  const resolved = presentExecutiveKpiCount(state.summary?.resolvedFindingsCount30Days, { loading });
  const discovered = presentExecutiveKpiCount(state.summary?.newlyDiscoveredFindingsCount30Days, { loading });
  const remediated = presentExecutiveKpiCount(state.summary?.realizedValue?.findingsRemediatedCount30Days, {
    loading,
  });
  const staleRisks = presentExecutiveKpiCount(loading ? undefined : state.staleRiskCount, { loading });
  const expiringWaivers = presentExecutiveKpiCount(loading ? undefined : state.expiringWaiversCount, { loading });
  const decisionsNeeded = presentExecutiveKpiCount(loading ? undefined : state.decisionsNeededCount, { loading });
  const costFreshness = presentCostEvidenceFreshness({
    loading,
    status: state.summary?.costEvidenceFreshnessStatus,
    savingsPricingBasis: state.summary?.savingsPricingBasis,
    staleAfterDays: state.summary?.costEvidenceStaleAfterDays,
  });
  const pilotDayNumber = computePilotDayNumber(state.summary?.firstCommitUtc);

  return (
    <>
      {pilotDayNumber !== null && !buyerPolished ? (
        <p
          className="m-0 text-sm text-neutral-600 dark:text-neutral-400 sm:col-span-2 lg:col-span-3"
          data-testid="exec-kpi-pilot-day-badge"
        >
          Day {pilotDayNumber} of your ArchLucid pilot
        </p>
      ) : null}
      <Card data-testid="exec-kpi-resolved-30d">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {v.resolvedFindings30dMetric.title}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            {v.resolvedFindings30dMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.resolvedFindings30d}
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
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {v.newlyDiscoveredFindings30dMetric.title}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            {v.newlyDiscoveredFindings30dMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.newlyDiscoveredFindings30d}
            testId="kpi-tile-discovered-30d-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {discovered.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={discovered.footnote} />
        </CardContent>
      </Card>

      <Card data-testid="exec-kpi-stale-risks">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {v.staleArchitectureRisksMetric.title}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            {v.staleArchitectureRisksMetric.description}{" "}
            <Link href="/governance/findings" className="underline">
              Risk register
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.staleArchitectureRisks}
            testId="kpi-tile-stale-risks-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {staleRisks.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={staleRisks.footnote} />
        </CardContent>
      </Card>

      <Card data-testid="exec-kpi-decisions-needed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {v.decisionsNeededMetric.title}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            {v.decisionsNeededMetric.description}{" "}
            <Link href="/governance/findings" className="underline">
              Risk register
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.decisionsNeeded}
            testId="kpi-tile-decisions-needed-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {decisionsNeeded.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={decisionsNeeded.footnote} />
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1" data-testid="exec-kpi-expiring-waivers">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {v.expiringWaiversMetric.title}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            {v.expiringWaiversMetric.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.expiringWaivers}
            testId="kpi-tile-expiring-waivers-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {expiringWaivers.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={expiringWaivers.footnote} />
        </CardContent>
      </Card>

      <Card data-testid="exec-kpi-remediated-30d">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {buyerPolished ? v.findingsRemediated30dMetric.title : "Findings remediated (30d)"}
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            {buyerPolished
              ? v.findingsRemediated30dMetric.description
              : "Computed from disposition workflow evidence"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.findingsRemediated30d}
            testId="kpi-tile-remediated-30d-link"
          >
            <p className={OPERATOR_TYPOGRAPHY.executiveDashboardMetric}>
              {remediated.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={remediated.footnote} />
        </CardContent>
      </Card>

      <Card data-testid="exec-kpi-cost-evidence-freshness">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Cost evidence freshness
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            Azure extractor evidence backing ROI cost findings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KpiTileDrillThroughLink
            href={EXECUTIVE_KPI_DRILL_THROUGH.costEvidenceFreshness}
            testId="kpi-tile-cost-evidence-freshness-link"
          >
            <p className="font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
              {costFreshness.display}
            </p>
          </KpiTileDrillThroughLink>
          <KpiFootnote text={costFreshness.footnote} runbookHref={costFreshness.runbookHref} />
        </CardContent>
      </Card>
    </>
  );
}
