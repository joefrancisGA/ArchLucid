"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { findHealthReadyEntryByName } from "@/lib/health-dashboard-types";
import { DATA_ARCHIVAL_HEALTH_LABELS } from "@/lib/operator/operator-health-labels";
import { isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function healthReadinessDotClass(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized.includes("unhealthy") || normalized.includes("down") || normalized.includes("fail")) {
    return "bg-red-500";
  }

  if (normalized.includes("degraded") || normalized.includes("warn")) {
    return "bg-amber-500";
  }

  if (normalized.includes("healthy") || normalized.includes("ok")) {
    return "bg-emerald-500";
  }

  return "bg-neutral-400";
}

function isHealthStatusHealthy(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return normalized.includes("healthy") || normalized.includes("ok");
}

export type SystemHealthStatusStripProps = {
  className?: string;
};

/** Readiness as inline metadata (no card chrome) — only shown when a real status is available. */
export function SystemHealthStatusStrip({ className }: SystemHealthStatusStripProps) {
  const queryEnabled =
    !isNextPublicDemoMode() && !isStaticDemoPayloadFallbackEnabled() && isOperatorExperienceFullShellEnv();

  const { data: ready, isPending } = useHealthReadySummaryQuery({ enabled: queryEnabled });

  const phase = useMemo(() => {
    if (!queryEnabled) {
      return "unavailable" as const;
    }

    if (isPending) {
      return "loading" as const;
    }

    if (ready === null) {
      return "unavailable" as const;
    }

    return "ready" as const;
  }, [isPending, queryEnabled, ready]);

  if (!queryEnabled) {
    return null;
  }

  const overall = ready?.status?.trim() ?? "";
  const archival = ready !== null && ready !== undefined ? findHealthReadyEntryByName(ready.entries, "data_archival") : null;
  const archivalStatus = archival?.status?.trim() ?? "";

  if (phase !== "ready" || overall.length === 0) {
    return null;
  }

  const overallHealthy = isHealthStatusHealthy(overall);
  const archivalHealthy = archival === null || archivalStatus.length === 0 || isHealthStatusHealthy(archivalStatus);

  if (overallHealthy && archivalHealthy) {
    return null;
  }

  return (
    <div
      data-testid="command-center-health-card"
      className={cn("mb-2 flex flex-col gap-1", OPERATOR_TYPOGRAPHY.helper, className)}
      aria-label="System health"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", healthReadinessDotClass(overall))}
          aria-hidden
        />
        <span className="text-al-text-primary">
          Platform services: <span className="font-medium">{overall}</span>
        </span>
        <Link href="/administration/system-health" className={cn("ml-auto inline-block font-semibold", OPERATOR_LINK.nav)}>
          Details
        </Link>
      </div>
      {archival !== null && archivalStatus.length > 0 ? (
        <div
          data-testid="command-center-data-archival-health"
          className="flex flex-wrap items-center gap-2 ps-0 sm:ps-4"
          aria-label={`${DATA_ARCHIVAL_HEALTH_LABELS.homeStripLabel}: ${archivalStatus}`}
        >
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", healthReadinessDotClass(archivalStatus))}
            aria-hidden
          />
          <span className="text-al-text-primary">
            {DATA_ARCHIVAL_HEALTH_LABELS.homeStripLabel}: <span className="font-medium">{archivalStatus}</span>
            {archivalStatus.toLowerCase().includes("degraded") ? (
              <span className="ms-1 text-amber-800 dark:text-amber-200">(warning)</span>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
