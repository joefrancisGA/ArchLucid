"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecutiveScorecardEmptyState } from "@/components/executive/ExecutiveScorecardEmptyState";
import { getComplianceDriftTrend } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { isApiRequestError } from "@/lib/api-request-error";
import { ExecutiveValueNarrativeBanner } from "@/components/ExecutiveValueNarrativeBanner";
import {
  buildExecutiveScorecardRecommendedActions,
  type ExecutiveScorecardRecommendedAction,
} from "@/lib/executive-scorecard-recommended-actions";
import {
  type ExecutiveTimeRange,
  windowForExecutiveRange,
} from "@/lib/executive-time-range";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import {
  BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL,
  BUYER_EXECUTIVE_SCORECARD_DRIFT_TREND_INSUFFICIENT,
  BUYER_EXECUTIVE_SCORECARD_LINK_REVIEW_PACKAGES,
  BUYER_EXECUTIVE_SCORECARD_NO_ACTIONS_HEALTHY,
  BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP,
} from "@/lib/buyer-polish-copy";
import { executiveShellHandoffLinkLabel } from "@/lib/executive-shell-handoff";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { formatHours, hoursSurfaced } from "@/lib/roi-assumptions";
import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

/** Used when severity-weighted ROI hours round to zero but committed reviews exist. */
const AVERAGE_MANUAL_REVIEW_HOURS = 3;

export type ExecutiveScorecardTimeRange = ExecutiveTimeRange;

function sumDriftChanges(points: ComplianceDriftTrendPoint[]): number {
  return points.reduce((sum, p) => {
    const n = p.changeCount;

    return sum + (typeof n === "number" && Number.isFinite(n) ? n : 0);
  }, 0);
}

function driftTrendLabel(points: ComplianceDriftTrendPoint[], buyerPolished: boolean): string {
  if (points.length < 2) {
    return buyerPolished
      ? BUYER_EXECUTIVE_SCORECARD_DRIFT_TREND_INSUFFICIENT
      : "Trend: not enough buckets in range";
  }

  const mid = Math.floor(points.length / 2);
  const firstHalf = points.slice(0, mid).reduce((s, p) => s + p.changeCount, 0);
  const secondHalf = points.slice(mid).reduce((s, p) => s + p.changeCount, 0);

  if (firstHalf === 0 && secondHalf === 0) {
    return "No policy pack changes in range";
  }

  if (secondHalf < firstHalf * 0.85) {
    return "Trend: decreasing change activity";
  }

  if (secondHalf > firstHalf * 1.15) {
    return "Trend: increasing change activity";
  }

  return "Trend: stable";
}

type ScorecardState =
  | { status: "loading" }
  | {
      status: "ready";
      report: PilotValueReportJson;
      driftPoints: ComplianceDriftTrendPoint[];
      precommitBlocks: number;
      precommitBlocksExact: boolean;
      recommendedActions: ExecutiveScorecardRecommendedAction[];
    }
  | { status: "error"; message: string; problem: ApiProblemDetails | null; correlationId: string | null };

async function fetchExecutiveRoiSummaryForScorecard(): Promise<ExecutiveRoiSummary | null> {
  try {
    const response = await fetch(
      `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ExecutiveRoiSummary;
  } catch {
    return null;
  }
}

export function ExecutiveScorecardClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const [range, setRange] = useState<ExecutiveScorecardTimeRange>("30d");
  const [state, setState] = useState<ScorecardState>({ status: "loading" });

  const load = useCallback(async (selected: ExecutiveScorecardTimeRange) => {
    setState({ status: "loading" });

    const { fromUtc, toUtc } = windowForExecutiveRange(selected);

    try {
      const report = await fetchPilotValueReportJson(fromUtc, toUtc);
      const driftFrom = fromUtc ?? report.fromUtc;

      const [driftPoints, blocked, executiveSummary] = await Promise.all([
        getComplianceDriftTrend(driftFrom, report.toUtc, 1440),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: report.fromUtc,
          toUtcIso: report.toUtc,
        }),
        fetchExecutiveRoiSummaryForScorecard(),
      ]);

      const driftTotal = sumDriftChanges(driftPoints);
      const recommendedActions = buildExecutiveScorecardRecommendedActions({
        complianceDriftChangeCount: driftTotal,
        orphanCandidates: executiveSummary?.orphanCandidates,
        committedRunsTimeline: report.committedRunsTimeline,
      });

      setState({
        status: "ready",
        report,
        driftPoints,
        precommitBlocks: blocked.count,
        precommitBlocksExact: blocked.exact,
        recommendedActions,
      });
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setState({
          status: "error",
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Could not load scorecard.",
          problem: null,
          correlationId: null,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthorityLoading && callerAuthorityRank < AUTHORITY_RANK.ReadAuthority) {
      return;
    }

    void load(range);
  }, [callerAuthorityRank, isAuthorityLoading, load, range]);

  if (!isAuthorityLoading && callerAuthorityRank < AUTHORITY_RANK.ReadAuthority) {
    return (
      <div className="space-y-6" data-testid="executive-scorecard">
        <header className="space-y-2">
          <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
            Executive view
          </p>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Executive scorecard</h1>
        </header>
        <Card className="border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-neutral-900 dark:text-neutral-100">Access required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
              Sign in with an account that has read access to this workspace to view value metrics.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="sm">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/reviews?projectId=default">Open review packages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthorityLoading) {
    return (
      <div className="space-y-6" data-testid="executive-scorecard">
        <header className="space-y-2">
          <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
            Executive view
          </p>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Executive scorecard</h1>
        </header>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Checking access…</p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-6" data-testid="executive-scorecard">
        <header className="space-y-2">
          <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
            Executive view
          </p>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Executive scorecard</h1>
        </header>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Loading scorecard…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-6" data-testid="executive-scorecard">
        <header className="space-y-2">
          <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
            Executive view
          </p>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Executive scorecard</h1>
        </header>
        <OperatorApiProblem
          fallbackMessage={state.message}
          problem={state.problem}
          correlationId={state.correlationId}
        />
        <Button type="button" variant="secondary" onClick={() => void load(range)}>
          Retry
        </Button>
      </div>
    );
  }

  const { report, driftPoints, precommitBlocks, precommitBlocksExact, recommendedActions } = state;
  const reviewsCount = report.totalRunsCommitted;
  const findingsTotal = report.totalFindings;
  const hoursRoi = hoursSurfaced({
    critical: report.findingsBySeverity.critical,
    high: report.findingsBySeverity.high,
    medium: report.findingsBySeverity.medium,
    precommitBlocks,
  });
  const estimatedHours =
    hoursRoi > 0 ? hoursRoi : reviewsCount * AVERAGE_MANUAL_REVIEW_HOURS;
  const driftTotal = sumDriftChanges(driftPoints);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const driftTrend = driftTrendLabel(driftPoints, buyerPolished);
  const scorecardEmpty = reviewsCount === 0;

  return (
    <div className="space-y-6" data-testid="executive-scorecard">
      <header className="space-y-2">
        <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
          Executive view
        </p>
        <h1 className="m-0 text-xl font-semibold tracking-tight text-al-text-primary">Executive scorecard</h1>
        <p className="m-0 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          Key value metrics for the current tenant, workspace, and project scope — aligned with the pilot value report and
          governance drift endpoints.
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xs">
          <label htmlFor="scorecard-time-range" className="mb-1 block text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Time range
          </label>
          <select
            id="scorecard-time-range"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
            value={range}
            onChange={(e) => setRange(e.target.value as ExecutiveScorecardTimeRange)}
            aria-describedby="scorecard-time-range-help"
          >
            <option value="30d">Last 30 days</option>
            <option value="quarter">Last quarter (90 days)</option>
            <option value="year">Last year</option>
            <option value="all">All time</option>
          </select>
          <p id="scorecard-time-range-help" className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {buyerPolished ? BUYER_EXECUTIVE_SCORECARD_WINDOW_HELP : "Window matches pilot-value-report bounds (toUtc exclusive where applicable)."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/executive/reviews">{BUYER_EXECUTIVE_SCORECARD_LINK_REVIEW_PACKAGES}</Link>
        </Button>
      </div>

      {scorecardEmpty ? (
        <ExecutiveScorecardEmptyState />
      ) : (
        <>
          <ExecutiveValueNarrativeBanner timeRange={range} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  Architecture reviews completed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="m-0 text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {finiteIntegerCountDisplay(reviewsCount)}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Findings generated</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="m-0 text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {finiteIntegerCountDisplay(findingsTotal)}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-400">Across committed reviews in range</p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Estimated hours saved</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="m-0 text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatHours(estimatedHours)}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {buyerPolished
                    ? "Estimated hours saved (methodology in pilot guide)"
                    : (
                        <>
                          Severity-weighted ROI model
                          {hoursRoi <= 0 && reviewsCount > 0
                            ? ` · fallback ${AVERAGE_MANUAL_REVIEW_HOURS} h × reviews when weighted hours are zero`
                            : ""}
                          {!precommitBlocksExact ? " · pre-commit block count may be capped" : ""}
                        </>
                      )}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-neutral-200 shadow-sm dark:border-neutral-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Compliance drift activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="m-0 text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {finiteIntegerCountDisplay(driftTotal)}
                </p>
                <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-400">{driftTrend}</p>
              </CardContent>
            </Card>
          </div>

          <Card
            className="border border-neutral-200 shadow-sm dark:border-neutral-800"
            data-testid="executive-scorecard-recommended-actions"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-neutral-900 dark:text-neutral-100">Recommended actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {recommendedActions.length === 0 ? (
                <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
                  {buyerPolished
                    ? BUYER_EXECUTIVE_SCORECARD_NO_ACTIONS_HEALTHY
                    : "No actions needed — all signals are healthy."}
                </p>
              ) : (
                <ul className="m-0 list-none space-y-4 p-0">
                  {recommendedActions.map((action) => (
                    <li key={action.id} className="space-y-1 border-b border-neutral-100 pb-4 last:border-0 last:pb-0 dark:border-neutral-800">
                      <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{action.headline}</p>
                      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">{action.explanation}</p>
                      <Link
                        href={action.href}
                        className="text-sm font-medium text-blue-700 underline dark:text-blue-400"
                        data-testid={`executive-scorecard-action-${action.id}`}
                      >
                        {executiveShellHandoffLinkLabel(action.href, { buyerPolished })}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <CollapsibleSection title="About these metrics" defaultOpen={false}>
            <ul className="m-0 list-disc space-y-2 ps-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li>
                Reviews and findings come from{" "}
                <Link href="/value-report/pilot" className="font-medium text-blue-700 underline dark:text-blue-400">
                  pilot value report
                </Link>{" "}
                (same API as operator ROI tiles).
              </li>
              <li>
                Estimated hours use the same coefficients as workspace health (critical/high/medium findings plus pre-commit
                blocks). When that sum is zero but reviews exist, the scorecard uses a simple reviews × hours fallback.
              </li>
              <li>Drift activity sums daily buckets from the governance compliance-drift-trend endpoint; trend compares first vs second half of the window.</li>
            </ul>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}
