"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { isDocumentHidden } from "@/lib/document-visibility";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { isAzureServiceBusHealthUnhealthy } from "@/lib/health-dashboard-types";
import { SERVICE_BUS_HEALTH_LABELS } from "@/lib/operator/operator-health-labels";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { SHELL_BANNER_POLL_MS } from "@/lib/shell-banner-poll-policy";

/**
 * Global warning when Azure Service Bus readiness is Unhealthy or Degraded (`azure_service_bus` on `GET /health/ready`).
 */
export function ServiceBusHealthBanner() {
  const [showWarning, setShowWarning] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const showWarningRef = useRef(false);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const retryRefresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const clearTimer = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    async function load(): Promise<boolean> {
      const ready = await fetchHealthReadySummary();

      if (cancelled) {
        return false;
      }

      if (ready === null) {
        setRefreshFailed(true);

        return showWarningRef.current;
      }

      setRefreshFailed(false);
      const unhealthy = isAzureServiceBusHealthUnhealthy(ready.entries);
      setShowWarning(unhealthy);
      showWarningRef.current = unhealthy;

      return unhealthy;
    }

    const startPollingWhenDegraded = () => {
      if (canceled || timer !== undefined || isDocumentHidden() || !showWarningRef.current) {
        return;
      }

      timer = window.setInterval(() => {
        void load();
      }, SHELL_BANNER_POLL_MS);
    };

    const onVisibilityChange = () => {
      if (isDocumentHidden()) {
        clearTimer();

        return;
      }

      void load().then((unhealthy) => {
        if (!canceled && unhealthy) {
          startPollingWhenDegraded();
        }
      });
    };

    void load().then((unhealthy) => {
      if (!canceled && unhealthy) {
        startPollingWhenDegraded();
      }
    });

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      canceled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimer();
    };
  }, [reloadToken]);

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!showWarning && !refreshFailed) {
    return null;
  }

  return (
    <div
      className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 px-4 py-3 shadow-sm", OPERATOR_TYPOGRAPHY.body)}
      role="alert"
      data-testid="service-bus-health-degraded-banner"
    >
      {showWarning ? (
        <>
          <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">{SERVICE_BUS_HEALTH_LABELS.bannerTitle}</p>
          <p className="m-0 mt-1 leading-snug">
            {SERVICE_BUS_HEALTH_LABELS.bannerBody}{" "}
            <Link href="/internal/health" className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100">
              {SERVICE_BUS_HEALTH_LABELS.systemHealthLink}
            </Link>
            .
          </p>
        </>
      ) : (
        <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">
          Service Bus health status unavailable
        </p>
      )}
      {refreshFailed ? (
        <div className="mt-2 space-y-2" data-testid="service-bus-health-refresh-failed">
          <p className="m-0 leading-snug text-amber-950/90 dark:text-amber-100/90">
            {showWarning
              ? "Could not refresh Service Bus health. Showing the last known degraded state until refresh succeeds."
              : "Could not confirm Service Bus readiness. Retry before assuming delivery is healthy."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retryRefresh}
            data-testid="service-bus-health-retry"
          >
            Retry status
          </Button>
        </div>
      ) : null}
    </div>
  );
}
