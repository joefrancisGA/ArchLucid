"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";

import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { fetchWeeklyDigestHealth } from "@/lib/api";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

/** Compact advisory / digest / executive-email coverage for the Digests hub. */
export function WeeklyDigestHealthBanner(): ReactElement {
  const [snap, setSnap] = useState<WeeklyDigestHealthDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const row = await fetchWeeklyDigestHealth();

        if (!cancelled) {
          setSnap(row);
        }
      } catch {
        if (!cancelled) {
          setSnap(null);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (snap === null) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading weekly digest health.</strong>
      </OperatorLoadingNotice>
    );
  }

  const healthyLoop =
    snap.enabledAdvisoryScheduleCount > 0 &&
    snap.enabledDigestSubscriptionCount > 0 &&
    snap.executiveEmailDigestEnabled;

  return (
    <div
      className="mb-6 rounded-lg border border-neutral-200 bg-white p-4 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="weekly-digest-health-banner"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Weekly digest health</h2>
          <p className="mt-1 m-0 text-neutral-600 dark:text-neutral-400">
            Enabled schedules: <span className="font-medium text-neutral-900 dark:text-neutral-100">{snap.enabledAdvisoryScheduleCount}</span>
            {" · "}
            Active digest routes: <span className="font-medium text-neutral-900 dark:text-neutral-100">{snap.enabledDigestSubscriptionCount}</span>
            {" · "}
            Executive email:{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {snap.executiveEmailDigestEnabled ? "on" : "off"}
            </span>{" "}
            ({snap.executiveDigestRecipientCount} recipient{snap.executiveDigestRecipientCount === 1 ? "" : "s"})
          </p>
          {!healthyLoop ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-900 dark:text-amber-200">
              {snap.setupGaps.slice(0, 3).map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 m-0 text-emerald-800 dark:text-emerald-200">Core weekly loop is configured for this scope.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-800"
            href="/advisory"
          >
            Advisory schedules
          </Link>
          <Link
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-100 dark:hover:bg-neutral-800"
            href="/integrations/operations"
          >
            Connector operations
          </Link>
        </div>
      </div>
    </div>
  );
}
