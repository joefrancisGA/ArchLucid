"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { useDocumentHidden } from "@/lib/document-visibility";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isAzureServiceBusHealthUnhealthy } from "@/lib/health-dashboard-types";
import { SERVICE_BUS_HEALTH_LABELS } from "@/lib/operator/operator-health-labels";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { shouldPollServiceBusHealthDegradedBanner } from "@/lib/shell-banner-poll-policy";
import {
  parseServiceBusHealthTechnicalProbeOpenFromSearch,
  serviceBusHealthTechnicalProbeDisclosureHrefFromSearch,
} from "@/lib/governance/service-bus-health-technical-probe-disclosure-url";

function readServiceBusHealthTechnicalProbeOpenFromWindowLocation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return parseServiceBusHealthTechnicalProbeOpenFromSearch(
    new URLSearchParams(window.location.search).get("serviceBusHealthTechnicalProbeOpen"),
  );
}

/**
 * Demo/static-demo shells may omit live health polling. Paying Working users must see real
 * degradation — buyer-polish is not a suppress flag (RS-06).
 */
function isServiceBusBannerSuppressed(): boolean {
  return isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
}

/**
 * Global warning when Azure Service Bus readiness is Unhealthy or Degraded (`azure_service_bus` on `GET /health/ready`).
 */
export function ServiceBusHealthBanner() {
  const pathname = usePathname() ?? "/";
  const [technicalProbeOpen, setTechnicalProbeOpenState] = useState(() =>
    readServiceBusHealthTechnicalProbeOpenFromWindowLocation(),
  );
  const technicalProbeOpenRef = useRef(technicalProbeOpen);
  technicalProbeOpenRef.current = technicalProbeOpen;

  const syncTechnicalProbeOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        serviceBusHealthTechnicalProbeDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setTechnicalProbeOpen = useCallback(
    (open: boolean) => {
      if (technicalProbeOpenRef.current === open) {
        return;
      }

      technicalProbeOpenRef.current = open;
      setTechnicalProbeOpenState(open);
      syncTechnicalProbeOpenToUrl(open);
    },
    [syncTechnicalProbeOpenToUrl],
  );

  useEffect(() => {
    const syncTechnicalProbeOpenFromUrl = (): void => {
      const nextOpen = readServiceBusHealthTechnicalProbeOpenFromWindowLocation();

      if (technicalProbeOpenRef.current === nextOpen) {
        return;
      }

      technicalProbeOpenRef.current = nextOpen;
      setTechnicalProbeOpenState(nextOpen);
    };

    syncTechnicalProbeOpenFromUrl();
    window.addEventListener("popstate", syncTechnicalProbeOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncTechnicalProbeOpenFromUrl);
    };
  }, []);

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

  const showWarning = data !== undefined && data !== null && isAzureServiceBusHealthUnhealthy(data.entries);
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
          <p className="m-0 mt-1 leading-snug">{SERVICE_BUS_HEALTH_LABELS.bannerBody}</p>
          <p className="m-0 mt-2 leading-snug">
            <Link
              href={SERVICE_BUS_HEALTH_LABELS.systemHealthHref}
              className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
            >
              {SERVICE_BUS_HEALTH_LABELS.systemHealthLink}
            </Link>
            .
          </p>
          <details
            className="mt-2"
            open={technicalProbeOpen}
            onToggle={(event) => {
              event.preventDefault();
              setTechnicalProbeOpen(!technicalProbeOpenRef.current);
            }}
          >
            <summary className="cursor-pointer text-sm text-amber-950/90 dark:text-amber-100/90">
              {SERVICE_BUS_HEALTH_LABELS.technicalProbeDisclosure}
            </summary>
            <p className="m-0 mt-1 text-sm leading-snug text-amber-950/90 dark:text-amber-100/90">
              <Link
                href={SERVICE_BUS_HEALTH_LABELS.internalHealthHref}
                className="font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
              >
                {SERVICE_BUS_HEALTH_LABELS.internalHealthLink}
              </Link>
            </p>
          </details>
        </>
      ) : (
        <>
          <p className="m-0 font-semibold text-amber-900 dark:text-amber-100">
            {SERVICE_BUS_HEALTH_LABELS.refreshFailedTitle}
          </p>
          <details
            className="mt-1"
            open={technicalProbeOpen}
            onToggle={(event) => {
              event.preventDefault();
              setTechnicalProbeOpen(!technicalProbeOpenRef.current);
            }}
          >
            <summary className="cursor-pointer text-sm text-amber-950/90 dark:text-amber-100/90">
              {SERVICE_BUS_HEALTH_LABELS.technicalProbeDisclosure}
            </summary>
          </details>
        </>
      )}
      {refreshFailed ? (
        <div className="mt-2 space-y-2" data-testid="service-bus-health-refresh-failed">
          <p className="m-0 leading-snug text-amber-950/90 dark:text-amber-100/90">
            {showWarning
              ? SERVICE_BUS_HEALTH_LABELS.refreshFailedBodyDegraded
              : SERVICE_BUS_HEALTH_LABELS.refreshFailedBodyUnknown}
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
