"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { isAzureServiceBusHealthUnhealthy } from "@/lib/health-dashboard-types";
import { SERVICE_BUS_HEALTH_LABELS } from "@/lib/i18n";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

const SERVICE_BUS_HEALTH_POLL_MS = 60_000;

/**
 * Global warning when Azure Service Bus readiness is Unhealthy or Degraded (`azure_service_bus` on `GET /health/ready`).
 */
export function ServiceBusHealthBanner() {
  const [showWarning, setShowWarning] = useState(false);

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

      setShowWarning(ready !== null && isAzureServiceBusHealthUnhealthy(ready.entries));
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, SERVICE_BUS_HEALTH_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!showWarning) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-amber-300/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50"
      role="alert"
      data-testid="service-bus-health-degraded-banner"
    >
      <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">{SERVICE_BUS_HEALTH_LABELS.bannerTitle}</p>
      <p className="m-0 mt-1 leading-snug">
        {SERVICE_BUS_HEALTH_LABELS.bannerBody}{" "} 
        <Link href="/admin/health" className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100">
          {SERVICE_BUS_HEALTH_LABELS.systemHealthLink}
        </Link>
        .
      </p>
    </div>
  );
}

