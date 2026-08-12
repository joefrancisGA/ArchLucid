"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { isDataArchivalHealthDegraded } from "@/lib/health-dashboard-types";
import { DATA_ARCHIVAL_HEALTH_LABELS } from "@/lib/operator/operator-health-labels";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

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
      className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-4 py-3 shadow-sm", OPERATOR_TYPOGRAPHY.body)}
      role="alert"
      data-testid="governance-dashboard-data-archival-degraded"
    >
      <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">{DATA_ARCHIVAL_HEALTH_LABELS.bannerTitle}</p>
      <p className="m-0 mt-1 leading-snug">
        {DATA_ARCHIVAL_HEALTH_LABELS.bannerBody}{" "}
        <Link href="/internal/health" className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100">
          {DATA_ARCHIVAL_HEALTH_LABELS.systemHealthLink}
        </Link>
        .
      </p>
    </div>
  );
}

