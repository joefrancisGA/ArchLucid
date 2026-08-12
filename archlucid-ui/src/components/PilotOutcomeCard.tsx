"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

type PilotOutcomeSummary = {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  runsInPeriod: number;
  runsWithCommittedManifest: number;
};

/** Trailing 30-day pilot rollup for operator home (all tiers; empty state when no runs). */
export function PilotOutcomeCard() {
  const [summary, setSummary] = useState<PilotOutcomeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        const res = await fetch("/api/proxy/v1/pilots/outcome-summary", {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as PilotOutcomeSummary;

        if (!canceled) {
          setSummary(json);
        }
      } catch (e: unknown) {
        if (!canceled) {
          setError(e instanceof Error ? e.message : "Failed to load pilot outcome summary.");
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  if (error) {
    return (
      <section
        aria-labelledby="pilot-outcome-heading"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="pilot-outcome-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot health (last 30 days)
        </h2>
        <div className={cn("mt-2 flex items-center gap-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-600" aria-hidden />
          Data unavailable — {error}
        </div>
      </section>
    );
  }

  if (summary === null) {
    return (
      <section
        aria-labelledby="pilot-outcome-heading"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="pilot-outcome-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot health (last 30 days)
        </h2>
        <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
      </section>
    );
  }

  const runsParsed = Number.isFinite(Number(summary.runsInPeriod)) ? Number(summary.runsInPeriod) : 0;

  if (!Number.isFinite(runsParsed) || runsParsed < 1) {
    return (
      <section
        aria-labelledby="pilot-outcome-heading"
        className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <h2 id="pilot-outcome-heading" className={cn("font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot health (last 30 days)
        </h2>
        <p className={cn("mt-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          After your first finalized review, this panel will show success rates, finalized manifests, and
          time-to-finalization trends.
        </p>
      </section>
    );
  }

  const inPeriod = Number.isFinite(summary.runsInPeriod) ? Math.max(0, summary.runsInPeriod) : 0;
  const withManifest = Number.isFinite(summary.runsWithCommittedManifest)
    ? Math.max(0, summary.runsWithCommittedManifest)
    : 0;

  const successRate = inPeriod > 0 ? Math.round((withManifest / inPeriod) * 100) : 0;

  const displaySuccessRate = Number.isFinite(successRate) ? Math.min(100, Math.max(0, successRate)) : 0;

  return (
    <section
      aria-labelledby="pilot-outcome-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="pilot-outcome-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Pilot health (last 30 days)
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <dd className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{displaySuccessRate}%</dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Success rate</dt>
        </div>
        <div>
          <dd className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{inPeriod}</dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Reviews (period)</dt>
        </div>
        <div>
          <dd className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{withManifest}</dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Finalized</dt>
        </div>
      </dl>
      <p className={cn("mt-2 text-center font-mono text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.badge)}>
        {summary.periodStart} → {summary.periodEnd}
      </p>
    </section>
  );
}
