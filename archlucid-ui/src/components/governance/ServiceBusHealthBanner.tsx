"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { useDocumentHidden } from "@/lib/document-visibility";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isAzureServiceBusHealthUnhealthy } from "@/lib/health-dashboard-types";
import { SERVICE_BUS_HEALTH_LABELS } from "@/lib/operator/operator-health-labels";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { shouldPollServiceBusHealthDegradedBanner } from "@/lib/shell-banner-poll-policy";

function isServiceBusBannerSuppressed(): boolean {
  return isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv();
}

/**
 * Global warning when Azure Service Bus readiness is Unhealthy or Degraded (`azure_service_bus` on `GET /health/ready`).
 */
export function ServiceBusHealthBanner() {
  const documentHidden = useDocumentHidden();
  const queryEnabled = !isServiceBusBannerSuppressed();

  const { data, isError, isRefetchError, refetch } = useHealthReadySummaryQuery({
    enabled: queryEnabled,
    throwOnUnavailable: true,
    documentHidden,
    shouldPoll: shouldPollServiceBusHealthDegradedBanner,
  });

  if (!queryEnabled) {
    return null;
  }

  const showWarning = data !== undefined && isAzureServiceBusHealthUnhealthy(data.entries);
  const refreshFailed = isError || isRefetchError;

  if (!showWarning && !refreshFailed) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised px-4 py-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="alert"
      data-testid="service-bus-health-degraded-banner"
    >
      {showWarning ? (
        <>
          <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">{SERVICE_BUS_HEALTH_LABELS.bannerTitle}</p>
          <p className="m-0 mt-1 leading-snug">
            {SERVICE_BUS_HEALTH_LABELS.bannerBody}{" "}
            <Link
              href="/internal/health"
              className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
            >
              {SERVICE_BUS_HEALTH_LABELS.systemHealthLink}
            </Link>
            .
          </p>
        </>
      ) : (
        <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">Service Bus health status unavailable</p>
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
            onClick={() => {
              void refetch();
            }}
            data-testid="service-bus-health-retry"
          >
            Retry status
          </Button>
        </div>
      ) : null}
    </div>
  );
}
