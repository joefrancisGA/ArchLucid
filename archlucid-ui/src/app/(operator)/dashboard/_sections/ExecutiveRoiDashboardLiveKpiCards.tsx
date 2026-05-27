"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import {
  getArchitectureRiskRegister,
  type ArchitectureRiskRegisterEntry,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const EXECUTIVE_ROI_SUMMARY_PATH = `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`;
const RISK_EXCEPTIONS_PATH = `/api/proxy/${ApiV1Routes.governance}/risk-exceptions`;

type LiveKpiState = {
  summary: ExecutiveRoiSummary | null;
  staleRiskCount: number;
  expiringWaiversCount: number;
};

function countExpiringWaivers(records: RiskExceptionRecord[]): number {
  const soon = Date.now() + 14 * 24 * 60 * 60 * 1000;

  return records.filter((record) => {
    const expires = Date.parse(record.expiresAtUtc);

    return Number.isFinite(expires) && expires <= soon;
  }).length;
}

function countStaleRisks(entries: ArchitectureRiskRegisterEntry[]): number {
  return entries.filter((entry) => entry.isStale).length;
}

function formatCount(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

/** Live KPI tiles for `/dashboard` backed by ROI and governance stickiness APIs (TB-062). */
export function ExecutiveRoiDashboardLiveKpiCards() {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;
  const [state, setState] = useState<LiveKpiState>({ summary: null, staleRiskCount: 0, expiringWaiversCount: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [summaryRes, riskRegister, exceptionsRes] = await Promise.all([
          fetch(
            EXECUTIVE_ROI_SUMMARY_PATH,
            mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
          ),
          getArchitectureRiskRegister(),
          fetch(
            RISK_EXCEPTIONS_PATH,
            mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
          ),
        ]);

        if (!summaryRes.ok) {
          throw new Error(`Executive summary HTTP ${summaryRes.status}`);
        }

        const summary = (await summaryRes.json()) as ExecutiveRoiSummary & {
          resolvedFindingsCount30Days?: number;
          newlyDiscoveredFindingsCount30Days?: number;
        };

        let expiringWaiversCount = 0;

        if (exceptionsRes.ok) {
          const exceptions = (await exceptionsRes.json()) as RiskExceptionRecord[];

          expiringWaiversCount = countExpiringWaivers(exceptions);
        }

        if (!cancelled) {
          setState({
            summary,
            staleRiskCount: countStaleRisks(riskRegister.entries),
            expiringWaiversCount,
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

  const resolved = state.summary?.resolvedFindingsCount30Days;
  const discovered = state.summary?.newlyDiscoveredFindingsCount30Days;

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
            {loading ? "…" : formatCount(resolved)}
          </p>
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
            {loading ? "…" : formatCount(discovered)}
          </p>
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
            {loading ? "…" : formatCount(state.staleRiskCount)}
          </p>
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
            {loading ? "…" : formatCount(state.expiringWaiversCount)}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
