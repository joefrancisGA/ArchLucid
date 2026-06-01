"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { getGovernanceDecisionsNeededSummary } from "@/lib/api/governance-stickiness-api";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import {
  presentCostEvidenceFreshness,
  presentExecutiveKpiCount,
} from "@/lib/executive-roi-kpi-display";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;
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
          <Link href={toDocsBlobUrl(props.runbookHref)} className="underline" rel="noopener noreferrer" target="_blank">
            Runbook
          </Link>
        </>
      ) : null}
    </p>
  );
}

/** Live KPI tiles for `/dashboard` backed by ROI and governance stickiness APIs (TB-062). */
export function ExecutiveRoiDashboardLiveKpiCards() {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const [state, setState] = useState<LiveKpiState>({
    summary: null,
    staleRiskCount: 0,
    expiringWaiversCount: 0,
    decisionsNeededCount: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [summaryRes, decisionsNeeded] = await Promise.all([
          fetch(
            EXECUTIVE_ROI_SUMMARY_PATH,
            mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
          ),
          getGovernanceDecisionsNeededSummary(),
        ]);

        if (!summaryRes.ok) {
          throw new Error(`Executive summary HTTP ${summaryRes.status}`);
        }

        const summary = (await summaryRes.json()) as ExecutiveRoiSummary & {
          resolvedFindingsCount30Days?: number;
          newlyDiscoveredFindingsCount30Days?: number;
          expiringWaiversCount14Days?: number;
          staleArchitectureRiskCount?: number;
        };

        if (!cancelled) {
          setState({
            summary,
            staleRiskCount:
              summary.staleArchitectureRiskCount ?? decisionsNeeded.staleRisks,
            // TB-155 / EXECUTIVE_KPI_SEMANTIC_CONTRACT: live governance count only (not cached ROI).
            expiringWaiversCount: decisionsNeeded.waiversExpiringWithin14Days,
            decisionsNeededCount: decisionsNeeded.totalDecisionItems,
          });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load executive KPIs.");
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
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2 lg:col-span-3" role="alert">
        {error}
      </p>
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

  return (
    <>
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
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {resolved.display}
          </p>
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
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {discovered.display}
          </p>
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
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {staleRisks.display}
          </p>
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
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {decisionsNeeded.display}
          </p>
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
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {expiringWaivers.display}
          </p>
          <KpiFootnote text={expiringWaivers.footnote} />
        </CardContent>
      </Card>

      <Card data-testid="exec-kpi-remediated-30d">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Findings remediated (30d)
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            Computed from disposition workflow evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
            {remediated.display}
          </p>
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
          <p className="font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
            {costFreshness.display}
          </p>
          <KpiFootnote text={costFreshness.footnote} runbookHref={costFreshness.runbookHref} />
        </CardContent>
      </Card>
    </>
  );
}
