"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { StatusPill } from "@/components/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listRunsByProjectPaged } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { formatFindings, formatHours } from "@/components/BeforeAfterDelta/formatDelta";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import type { HealthReadyResponse } from "@/lib/health-dashboard-types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

const DEFAULT_PROJECT_ID = "default";

function runListPrimaryTitle(run: RunSummary): string {
  const d = run.description?.trim() ?? "";

  if (d.length > 0) {
    return d;
  }

  return "Untitled run";
}

function isRunNeedingAttention(run: RunSummary): boolean {
  return run.hasFindingsSnapshot === true && run.hasGoldenManifest !== true;
}

function RunsNeedingAttentionCard() {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [items, setItems] = useState<RunSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase("loading");
      setFailure(null);

      try {
        const raw: unknown = await listRunsByProjectPaged(DEFAULT_PROJECT_ID, 1, 5);
        const coerced = coerceRunSummaryPaged(raw);

        if (cancelled) {
          return;
        }

        if (!coerced.ok) {
          setFailure(uiFailureFromMessage(coerced.message));
          setPhase("error");

          return;
        }

        setItems(coerced.value.items);
        setPhase("ready");
      } catch (e) {
        if (cancelled) {
          return;
        }

        setFailure(toApiLoadFailure(e));
        setPhase("error");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const attention = useMemo(() => items.filter(isRunNeedingAttention), [items]);
  const preview = useMemo(() => attention.slice(0, 3), [attention]);

  return (
    <Card
      className={cn(
        "border border-neutral-200 bg-neutral-50/60 shadow-none dark:border-neutral-800 dark:bg-neutral-900/30",
      )}
      data-testid="command-center-runs-card"
    >
      <CardHeader className="space-y-1 px-3 pb-2 pt-3">
        <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Runs needing attention
        </CardTitle>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Ready for commit (findings without manifest) on the first page for project{" "}
          <code className="text-[11px]">{DEFAULT_PROJECT_ID}</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 text-sm">
        {phase === "loading" ? (
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">Loading runs…</p>
        ) : null}

        {phase === "error" && failure !== null ? (
          <div className="text-xs [&_strong]:text-sm">
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
            />
          </div>
        ) : null}

        {phase === "ready" ? (
          <>
            <p className="m-0 text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {attention.length} on this page snapshot
            </p>
            {attention.length === 0 ? (
              <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                All runs are committed. Create a new run or wait for pipeline results.
              </p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {preview.map((run) => (
                  <li key={run.runId} className="flex flex-wrap items-start gap-2 border-b border-neutral-100 pb-2 last:border-b-0 last:pb-0 dark:border-neutral-800">
                    <span className="min-w-0 flex-1 text-xs font-medium text-neutral-900 dark:text-neutral-100">
                      {runListPrimaryTitle(run)}
                    </span>
                    <RunStatusBadge run={run} className="text-[0.6rem]" />
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/runs?projectId=${encodeURIComponent(DEFAULT_PROJECT_ID)}`}
              className="inline-block text-xs font-semibold text-teal-800 underline dark:text-teal-300"
            >
              Open runs
            </Link>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RecentActivityCommandCard() {
  const { status, data } = useDeltaQuery({ count: 5 });

  return (
    <Card
      className="border border-neutral-200 bg-neutral-50/60 shadow-none dark:border-neutral-800 dark:bg-neutral-900/30"
      data-testid="command-center-activity-card"
    >
      <CardHeader className="space-y-1 px-3 pb-2 pt-3">
        <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent activity</CardTitle>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Median proof-of-ROI delta across recent committed runs (same source as the runs index banner).
        </p>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 text-sm">
        {status === "loading" ? (
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">Loading activity…</p>
        ) : null}

        {status === "error" ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            Activity snapshot is unavailable right now. Try again later or open the runs list.
          </p>
        ) : null}

        {status === "ready" && data !== null && data.returnedCount > 0 ? (
          <dl className="m-0 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[10px] uppercase text-neutral-500 dark:text-neutral-400">Findings</dt>
              <dd className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatFindings(data.medianTotalFindings)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-neutral-500 dark:text-neutral-400">Time to commit</dt>
              <dd className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {formatHours(data.medianTimeToCommittedManifestTotalSeconds)}
              </dd>
            </div>
          </dl>
        ) : null}

        {status === "ready" && data !== null && data.returnedCount === 0 ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            No committed-run medians yet — finish a run through manifest to populate this card.
          </p>
        ) : null}

        <Link
          href={`/runs?projectId=${encodeURIComponent(DEFAULT_PROJECT_ID)}`}
          className="inline-block text-xs font-semibold text-teal-800 underline dark:text-teal-300"
        >
          View runs
        </Link>
      </CardContent>
    </Card>
  );
}

function SystemHealthCommandCard() {
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">("loading");
  const [ready, setReady] = useState<HealthReadyResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase("loading");

      try {
        const res = await fetch(
          "/api/proxy/health/ready",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
        );

        if (cancelled) {
          return;
        }

        if (!res.ok) {
          setReady(null);
          setPhase("unavailable");

          return;
        }

        const body = (await res.json()) as HealthReadyResponse;
        setReady(body);
        setPhase("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setReady(null);
        setPhase("unavailable");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const overall = ready?.status?.trim() ?? "";

  return (
    <Card
      className="border border-neutral-200 bg-neutral-50/60 shadow-none dark:border-neutral-800 dark:bg-neutral-900/30"
      data-testid="command-center-health-card"
    >
      <CardHeader className="space-y-1 px-3 pb-2 pt-3">
        <CardTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">System health</CardTitle>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">Anonymous readiness summary from the API.</p>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 text-sm">
        {phase === "loading" ? (
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">Checking readiness…</p>
        ) : null}

        {phase === "unavailable" ? (
          <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            Health dashboard not configured yet.
          </p>
        ) : null}

        {phase === "ready" && overall.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={overall} domain="health" ariaLabel={`Overall readiness: ${overall}`} />
          </div>
        ) : null}

        {phase === "ready" && overall.length === 0 ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">Readiness payload had no overall status.</p>
        ) : null}

        <Link href="/admin/health" className="inline-block text-xs font-semibold text-teal-800 underline dark:text-teal-300">
          Open system health
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Command center: runs snapshot, recent delta medians, and API readiness — always on home so the page stays an
 * operator cockpit, not only a first-run checklist.
 */
export function CommandCenterSection() {
  return (
    <section className="mt-6" aria-labelledby="command-center-heading">
      <h3 id="command-center-heading" className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Command center
      </h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RunsNeedingAttentionCard />
        <RecentActivityCommandCard />
        <SystemHealthCommandCard />
      </div>
    </section>
  );
}
