"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { findHealthReadyEntryByName, type HealthReadyResponse } from "@/lib/health-dashboard-types";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";

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

type SystemHealthStatusStripProps = {
  className?: string;
};

/** Readiness as inline metadata (no card chrome) — only shown when a real status is available. */
export function SystemHealthStatusStrip({ className }: SystemHealthStatusStripProps) {
  const [phase, setPhase] = useState<"loading" | "ready" | "unavailable">("loading");
  const [ready, setReady] = useState<HealthReadyResponse | null>(null);

  useEffect(() => {
    if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    let cancelled = false;

    async function load() {
      setPhase("loading");

      try {
        const body = await fetchHealthReadySummary();

        if (cancelled) {
          return;
        }

        if (body === null) {
          setReady(null);
          setPhase("unavailable");

          return;
        }

        setReady(body);
        setPhase("ready");
      } catch {
        if (cancelled) {
          return;
        }

        setReady(null);
        setPhase("unavailable");
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const overall = ready?.status?.trim() ?? "";
  const archival = ready !== null ? findHealthReadyEntryByName(ready.entries, "data_archival") : null;
  const archivalStatus = archival?.status?.trim() ?? "";

  if (phase !== "ready" || overall.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="command-center-health-card"
      className={cn("mb-2 flex flex-col gap-1 text-xs", className)}
      aria-label="System health"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn("h-2 w-2 shrink-0 rounded-full", healthReadinessDotClass(overall))}
          aria-hidden
        />
        <span className="text-neutral-800 dark:text-neutral-200">
          Platform services: <span className="font-medium">{overall}</span>
        </span>
        <Link
          href="/health"
          className="ml-auto inline-block text-xs font-semibold text-teal-800 underline dark:text-teal-300"
        >
          Details
        </Link>
      </div>
      {archival !== null && archivalStatus.length > 0 ? (
        <div
          data-testid="command-center-data-archival-health"
          className="flex flex-wrap items-center gap-2 ps-0 sm:ps-4"
          aria-label={`Data archival health: ${archivalStatus}`}
        >
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", healthReadinessDotClass(archivalStatus))}
            aria-hidden
          />
          <span className="text-neutral-800 dark:text-neutral-200">
            Data archival: <span className="font-medium">{archivalStatus}</span>
            {archivalStatus.toLowerCase().includes("degraded") ? (
              <span className="ms-1 text-amber-800 dark:text-amber-200">(warning)</span>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
