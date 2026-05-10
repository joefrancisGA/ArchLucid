"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplianceDriftTrend } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { isApiRequestError } from "@/lib/api-request-error";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { formatHours, hoursSurfaced } from "@/lib/roi-assumptions";
import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

/** Used when severity-weighted ROI hours round to zero but committed runs exist. */
const AVERAGE_MANUAL_REVIEW_HOURS = 3;

export type ExecutiveScorecardTimeRange = "30d" | "quarter" | "all";

function rollingBounds(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

function windowForRange(range: ExecutiveScorecardTimeRange): { fromUtc: string | null; toUtc: string } {
  const toUtc = new Date().toISOString();

  if (range === "30d") {
    const b = rollingBounds(30);

    return { fromUtc: b.fromUtc, toUtc: b.toUtc };
  }

  if (range === "quarter") {
    const b = rollingBounds(90);

    return { fromUtc: b.fromUtc, toUtc: b.toUtc };
  }

  return { fromUtc: null, toUtc };
}

function sumDriftChanges(points: ComplianceDriftTrendPoint[]): number {
  return points.reduce((sum, p) => {
    const n = p.changeCount;

    return sum + (typeof n === "number" && Number.isFinite(n) ? n : 0);
  }, 0);
}

function driftTrendLabel(points: ComplianceDriftTrendPoint[]): string {
  if (points.length < 2) {
    return "Trend: not enough buckets in range";
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
    }
  | { status: "error"; message: string; problem: ApiProblemDetails | null; correlationId: string | null };

export function ExecutiveScorecardClient() {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const [range, setRange] = useState<ExecutiveScorecardTimeRange>("30d");
  const [state, setState] = useState<ScorecardState>({ status: "loading" });

  const load = useCallback(async (selected: ExecutiveScorecardTimeRange) => {
    setState({ status: "loading" });

    const { fromUtc, toUtc } = windowForRange(selected);

    try {
      const report = await fetchPilotValueReportJson(fromUtc, toUtc);
      const driftFrom = fromUtc ?? report.fromUtc;

      const [driftPoints, blocked] = await Promise.all([
        getComplianceDriftTrend(driftFrom, report.toUtc, 1440),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: report.fromUtc,
          toUtcIso: report.toUtc,
        }),
      ]);

      setState({
        status: "ready",
        report,
        driftPoints,
        precommitBlocks: blocked.count,
        precommitBlocksExact: blocked.exact,
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
          <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Executive scorecard</h1>
        </header>
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
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
                <Link href="/">Open operator shell</Link>
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
          <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Executive scorecard</h1>
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
          <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Executive scorecard</h1>
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
          <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Executive scorecard</h1>
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

  const { report, driftPoints, precommitBlocks, precommitBlocksExact } = state;
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
  const driftTrend = driftTrendLabel(driftPoints);

  return (
    <div className="space-y-6" data-testid="executive-scorecard">
      <header className="space-y-2">
        <p className="m-0 text-sm font-medium uppercase tracking-wide text-teal-800 dark:text-teal-300">
          Executive view
        </p>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Executive scorecard</h1>
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
            <option value="all">All time</option>
          </select>
          <p id="scorecard-time-range-help" className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Window matches pilot-value-report bounds (toUtc exclusive where applicable).
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/executive/reviews">Architecture risk reviews</Link>
        </Button>
      </div>

      {reviewsCount === 0 ? (
        <div
          className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          role="status"
        >
          <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">No committed runs in this range</p>
          <p className="m-0 mt-1 leading-snug">
            Figures below are placeholders. Operators can finalize a review to populate ROI and drift context.
          </p>
        </div>
      ) : null}

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
            <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-400">Committed runs (pilot-value-report)</p>
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
            <p className="m-0 mt-1 text-xs text-neutral-500 dark:text-neutral-400">Across committed runs in range</p>
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
              Severity-weighted ROI model
              {hoursRoi <= 0 && reviewsCount > 0
                ? ` · fallback ${AVERAGE_MANUAL_REVIEW_HOURS} h × reviews when weighted hours are zero`
                : ""}
              {!precommitBlocksExact ? " · pre-commit block count may be capped" : ""}
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
            blocks). When that sum is zero but reviews exist, the scorecard uses a simple runs × hours fallback.
          </li>
          <li>Drift activity sums daily buckets from the governance compliance-drift-trend endpoint; trend compares first vs second half of the window.</li>
        </ul>
      </CollapsibleSection>
    </div>
  );
}
