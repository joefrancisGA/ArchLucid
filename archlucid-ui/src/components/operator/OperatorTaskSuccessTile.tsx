"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import type { OperatorTaskSuccessRates } from "@/lib/fetch-operator-task-success-rates";
import { fetchOperatorTaskSuccessRates } from "@/lib/fetch-operator-task-success-rates";

function safeNonNegativeWholeDisplay(value: unknown): string {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return "—";
  }

  return String(Math.floor(numeric));
}

function safeSessionsToFinalizedPercent(ratio: unknown, sessionsTotal: unknown): string {
  const sessions = typeof sessionsTotal === "number" ? sessionsTotal : Number(sessionsTotal);
  const r = typeof ratio === "number" ? ratio : Number(ratio);

  if (!Number.isFinite(sessions) || sessions <= 0 || !Number.isFinite(r)) {
    return "—";
  }

  const pct = Math.round(r * 100);

  if (!Number.isFinite(pct)) {
    return "—";
  }

  return `${Math.min(100, Math.max(0, pct))}%`;
}

/** Small operator-home tile for pilot adoption counters (process lifetime; resets on API restart). */
export function OperatorTaskSuccessTile() {
  const [data, setData] = useState<OperatorTaskSuccessRates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        const json = await fetchOperatorTaskSuccessRates();

        if (!canceled) {
          setData(json);
          setError(null);
        }
      } catch {
        if (!canceled) {
          setError("Metrics unavailable.");
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
        aria-labelledby="operator-task-success-heading"
        className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <h2 id="operator-task-success-heading" className={cn("font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot adoption
        </h2>
        <p className={cn("mt-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          No data yet. Metrics appear after your first completed review session.
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section
        aria-labelledby="operator-task-success-heading"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="operator-task-success-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot adoption
        </h2>
        <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="operator-task-success-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="operator-task-success-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Pilot adoption
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <dd className="m-0 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {safeNonNegativeWholeDisplay(data.firstSessionCompletedTotal)}
          </dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Sessions</dt>
        </div>
        <div>
          <dd className="m-0 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {safeNonNegativeWholeDisplay(data.firstRunCommittedTotal)}
          </dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Finalized</dt>
        </div>
        <div>
          <dd className="m-0 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {safeSessionsToFinalizedPercent(data.firstRunCommittedPerSessionRatio, data.firstSessionCompletedTotal)}
          </dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Conversion</dt>
        </div>
      </dl>
      <p className={cn("mt-2 text-center text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.badge)}>{data.windowNote}</p>
    </section>
  );
}
