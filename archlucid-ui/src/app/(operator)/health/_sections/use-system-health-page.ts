"use client";

import { useCallback, useEffect, useState } from "react";

import type { HealthReadyResponse, VersionInfoResponse } from "@/lib/health-dashboard-types";
import { fetchHealthLive } from "@/lib/fetch-health-live";
import { HEALTH_READY_PATH, HEALTH_VERSION_PATH } from "@/lib/health-endpoint-paths";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { buildCriticalDependencyRows } from "@/lib/system-health-critical-dependencies";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

import type { SystemHealthPageViewModel } from "./system-health-page-view-model";

export function useSystemHealthPage(): SystemHealthPageViewModel {
  const isDemo =
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv();

  const [loading, setLoading] = useState(!isDemo);
  const [liveOk, setLiveOk] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Unknown");
  const [ready, setReady] = useState<HealthReadyResponse | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [version, setVersion] = useState<VersionInfoResponse | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo) {
      return;
    }

    setLoading(true);
    setReadyError(null);

    const jsonInit = mergeRegistrationScopeForProxy({
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    try {
      const [live, readyRes, versionRes] = await Promise.all([
        fetchHealthLive(),
        fetch(HEALTH_READY_PATH, jsonInit),
        fetch(HEALTH_VERSION_PATH, jsonInit),
      ]);

      setLiveOk(live.ok);
      setLiveStatus(live.body?.status?.trim() || (live.ok ? "Healthy" : "Unavailable"));

      if (readyRes.ok) {
        setReady((await readyRes.json()) as HealthReadyResponse);
      } else {
        setReady(null);
        setReadyError(`Readiness check failed (HTTP ${readyRes.status}).`);
      }

      if (versionRes.ok) {
        setVersion((await versionRes.json()) as VersionInfoResponse);
      } else {
        setVersion(null);
      }
    } catch (e) {
      setReadyError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void refresh();
  }, [isDemo, refresh]);

  const criticalDependencies = buildCriticalDependencyRows(ready?.entries ?? []);

  return {
    loading,
    liveOk,
    liveStatus,
    ready,
    readyError,
    version,
    criticalDependencies,
    refresh,
  };
}
