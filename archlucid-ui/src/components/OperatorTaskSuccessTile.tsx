"use client";

import { useEffect, useState } from "react";

import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type Rates = {
  windowNote: string;
  firstRunCommittedTotal: number;
  firstSessionCompletedTotal: number;
  firstRunCommittedPerSessionRatio: number;
};

/** Small operator-home tile for onboarding funnel counters (process lifetime; resets on API restart). */
export function OperatorTaskSuccessTile() {
  const [data, setData] = useState<Rates | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          "/api/proxy/v1/diagnostics/operator-task-success-rates",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok) {
          throw new Error(String(res.status));
        }

        const json = (await res.json()) as Rates;

        if (!cancelled) {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setError("Metrics unavailable.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="operator-task-success-heading"
      className="rounded-md border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="operator-task-success-heading" className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        Onboarding funnel (host process)
      </h2>
      {error ? <p className="text-neutral-600 dark:text-neutral-400">{error}</p> : null}
      {data ? (
        <dl className="m-0 grid grid-cols-2 gap-2">
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-400">First sessions completed</dt>
            <dd className="m-0 text-lg font-semibold">{data.firstSessionCompletedTotal}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-400">First runs committed</dt>
            <dd className="m-0 text-lg font-semibold">{data.firstRunCommittedTotal}</dd>
          </div>
          <div className="col-span-2 text-xs text-neutral-500 dark:text-neutral-400">{data.windowNote}</div>
        </dl>
      ) : null}
    </section>
  );
}
