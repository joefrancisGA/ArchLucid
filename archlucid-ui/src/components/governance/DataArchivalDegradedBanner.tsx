"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { isDataArchivalHealthDegraded } from "@/lib/health-dashboard-types";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/**
 * Warning when worker data archival last failed (`data_archival` on `GET /health/ready`).
 * Hidden when archival is disabled, the check is absent (API-only host), or readiness is unavailable.
 */
export function DataArchivalDegradedBanner() {
  const [showDegraded, setShowDegraded] = useState(false);

  useEffect(() => {
    if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    let cancelled = false;

    async function load() {
      const ready = await fetchHealthReadySummary();

      if (cancelled) {
        return;
      }

      setShowDegraded(ready !== null && isDataArchivalHealthDegraded(ready.entries));
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!showDegraded) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-4 py-3 text-sm shadow-sm"
      role="alert"
      data-testid="governance-dashboard-data-archival-degraded"
    >
      <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">Data retention archival is degraded</p>
      <p className="m-0 mt-1 leading-snug">
        The last background archival iteration failed while retention archival was enabled. Governance KPIs in this
        workspace may be stale until archival recovers. Review worker logs, then open{" "}
        <Link href="/admin/health" className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100">
          System health
        </Link>{" "}
        for the <span className="font-mono text-xs">data_archival</span> readiness check.
      </p>
    </div>
  );
}

