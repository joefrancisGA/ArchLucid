"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getPilotScorecard } from "@/lib/api";
import { loadCurrentPrincipal, shellBootstrapReadPrincipal, type CurrentPrincipal } from "@/lib/current-principal";
import {
  resolveFirstPilotCommandCenterPhase,
  type FirstPilotCommandCenterPhaseSummary,
} from "@/lib/first-pilot-command-center-phase";
import {
  buildFirstPilotReadinessRows,
  type FirstPilotReadinessRow,
  type FirstPilotReadinessStatus,
} from "@/lib/first-pilot-readiness-cockpit";
import {
  buildFirstPilotOperatingRailSignals,
  readFirstPilotDeferredBuyerRequirements,
  readFirstPilotEvidenceAcknowledged,
  type FirstPilotOperatingRailSignals,
} from "@/lib/first-pilot-operating-rail-status";
import { mapReadinessStatusToOperatorLabel } from "@/lib/first-pilot-operator-status-vocabulary";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

type Phase = "loading" | "ready";

function statusClass(status: FirstPilotReadinessStatus): string {
  switch (status) {
    case "ready":
      return "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100";
    case "attention":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "blocked":
      return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100";
    case "unknown":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function statusLabel(status: FirstPilotReadinessStatus): string {
  return mapReadinessStatusToOperatorLabel(status);
}

function firstBlockingRow(rows: readonly FirstPilotReadinessRow[]): FirstPilotReadinessRow | null {
  return rows.find((row) => row.status === "blocked" || row.status === "attention" || row.status === "unknown") ?? null;
}

function sponsorDispositionClass(disposition: FirstPilotCommandCenterPhaseSummary["sponsorDisposition"]): string {
  switch (disposition) {
    case "send":
      return "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100";
    case "hold":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "readiness-only":
      return "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200";
    case "deferred":
      return "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

function sponsorDispositionLabel(disposition: FirstPilotCommandCenterPhaseSummary["sponsorDisposition"]): string {
  switch (disposition) {
    case "send":
      return "Sponsor send";
    case "hold":
      return "Sponsor hold";
    case "readiness-only":
      return "Readiness only";
    case "deferred":
      return "Deferred scope";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

/** Single first-pilot command center: phase, readiness rows, sponsor disposition, and next action in one place. */
export function FirstPilotReadinessCockpit() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [principal, setPrincipal] = useState<CurrentPrincipal>(shellBootstrapReadPrincipal);
  const [signals, setSignals] = useState<FirstPilotOperatingRailSignals>(() =>
    buildFirstPilotOperatingRailSignals({
      healthStatus: null,
      runs: [],
      evidenceAcknowledged: false,
      hasCommittedManifest: false,
      latestRunId: null,
      firstCommittedRunId: null,
    }),
  );
  const [scorecard, setScorecard] = useState<PilotScorecardJson | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoadFailed, setHealthLoadFailed] = useState(false);
  const [runsLoadFailed, setRunsLoadFailed] = useState(false);
  const [scorecardLoadFailed, setScorecardLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setPhase("loading");

      const [readyBody, merged, ctx, loadedPrincipal, loadedScorecard] = await Promise.all([
        fetchHealthReadySummary().catch(() => null),
        loadProjectRunsMergedWithDemoFallback("default").catch(() => ({ items: [], loadError: true })),
        fetchCorePilotCommitContext().catch(() => ({
          hasCommittedManifest: false,
          latestRunId: null,
          firstCommittedRunId: null,
        })),
        loadCurrentPrincipal().catch(() => shellBootstrapReadPrincipal),
        getPilotScorecard().catch(() => null),
      ]);

      if (cancelled)
        return;

      const nextHealthStatus = readyBody?.status ?? null;
      setHealthStatus(nextHealthStatus);
      setHealthLoadFailed(readyBody === null);
      setRunsLoadFailed(merged.loadError === true);
      setPrincipal(loadedPrincipal);
      setScorecard(loadedScorecard);
      setScorecardLoadFailed(loadedScorecard === null);
      setSignals(
        buildFirstPilotOperatingRailSignals({
          healthStatus: nextHealthStatus,
          runs: merged.items,
          evidenceAcknowledged: readFirstPilotEvidenceAcknowledged(),
          hasCommittedManifest: ctx.hasCommittedManifest,
          latestRunId: ctx.latestRunId,
          firstCommittedRunId: ctx.firstCommittedRunId,
        }),
      );
      setPhase("ready");
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      buildFirstPilotReadinessRows({
        healthStatus,
        healthLoadFailed,
        runsLoadFailed,
        principal,
        signals,
        scorecard,
        scorecardLoadFailed,
      }),
    [healthStatus, healthLoadFailed, runsLoadFailed, principal, signals, scorecard, scorecardLoadFailed],
  );
  const blocker = firstBlockingRow(rows);
  const canExecute = principal.authorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const baselinesEntered =
    scorecard?.baselines?.baselineHoursPerReview !== null
    && scorecard?.baselines?.baselineHoursPerReview !== undefined
    && scorecard?.baselines?.baselineReviewsPerQuarter !== null
    && scorecard?.baselines?.baselineReviewsPerQuarter !== undefined
    && scorecard?.baselines?.baselineArchitectHourlyCost !== null
    && scorecard?.baselines?.baselineArchitectHourlyCost !== undefined;
  const commandCenter = useMemo(
    () =>
      resolveFirstPilotCommandCenterPhase({
        signals,
        baselinesEntered,
        canExecute,
        hasBlockingRow: blocker !== null,
        deferredBuyerRequirements: readFirstPilotDeferredBuyerRequirements(),
      }),
    [signals, baselinesEntered, canExecute, blocker],
  );

  if (phase === "loading") {
    return (
      <div
        className="min-h-[9rem] rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        aria-hidden
        data-testid="first-pilot-readiness-cockpit-loading"
      />
    );
  }

  return (
    <section
      aria-labelledby="first-pilot-readiness-cockpit-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="first-pilot-readiness-cockpit"
    >
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="first-pilot-readiness-cockpit-heading" className="m-0 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            First-pilot operator command center
          </h2>
          <p className="m-0 mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
            One place to see the next blocking step: platform, authority, evidence, architecture review pipeline, ROI
            baselines, proof collection, and sponsor SEND/HOLD/DEFERRED posture.
          </p>
        </div>
        <Link href={commandCenter.href} className="text-sm font-medium text-teal-800 underline dark:text-teal-300">
          Next action: {commandCenter.cta}
        </Link>
      </div>

      <article
        className={`mb-4 rounded-lg border p-3 ${sponsorDispositionClass(commandCenter.sponsorDisposition)}`}
        data-testid="first-pilot-command-center-phase"
        data-phase={commandCenter.phase}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {commandCenter.headline}
          </span>
          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {sponsorDispositionLabel(commandCenter.sponsorDisposition)}
          </span>
        </div>
        <p className="m-0 mt-2 text-sm leading-relaxed">{commandCenter.summary}</p>
      </article>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className={`rounded-lg border p-3 ${statusClass(row.status)}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {statusLabel(row.status)}
              </span>
              <h3 className="m-0 text-sm font-semibold">{row.label}</h3>
            </div>
            <p className="m-0 mt-2 text-xs leading-relaxed">{row.summary}</p>
            <Link href={row.href} className="mt-2 inline-block text-xs font-medium underline underline-offset-2">
              {row.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
