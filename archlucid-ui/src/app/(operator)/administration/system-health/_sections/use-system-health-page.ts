"use client";

import { useCallback, useEffect, useState } from "react";

import type { HealthReadyResponse, VersionInfoResponse } from "@/lib/health-dashboard-types";
import { fetchHealthLive } from "@/lib/fetch-health-live";
import { HEALTH_READY_PATH, HEALTH_VERSION_PATH } from "@/lib/health-endpoint-paths";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { buildCriticalDependencyRows } from "@/lib/system-health-critical-dependencies";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";

import type { SystemHealthPageViewModel } from "./system-health-page-view-model";

const DEMO_REFRESH_DELAY_MS = 350;

function isBuyerDemoSystemHealthShell(): boolean {
  return isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
}

export function useSystemHealthPage(): SystemHealthPageViewModel {
  const showDemoWorkspaceDashboard = isBuyerDemoSystemHealthShell();
  const isStaticDemo =
    isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled() || showDemoWorkspaceDashboard;

  const [loading, setLoading] = useState(showDemoWorkspaceDashboard ? false : !isStaticDemo);
  const [liveOk, setLiveOk] = useState(false);
  const [liveStatus, setLiveStatus] = useState("Unknown");
  const [ready, setReady] = useState<HealthReadyResponse | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [version, setVersion] = useState<VersionInfoResponse | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(
    showDemoWorkspaceDashboard ? new Date() : null,
  );

  const refreshLiveHealth = useCallback(async () => {
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
      setLastRefreshedAt(new Date());
      setLoading(false);
    }
  }, []);

  const refreshDemoHealth = useCallback(async () => {
    setLoading(true);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, DEMO_REFRESH_DELAY_MS);
    });

    setLastRefreshedAt(new Date());
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (showDemoWorkspaceDashboard) {
      await refreshDemoHealth();
      return;
    }

    if (isStaticDemo) {
      return;
    }

    await refreshLiveHealth();
  }, [isStaticDemo, refreshDemoHealth, refreshLiveHealth, showDemoWorkspaceDashboard]);

  useEffect(() => {
    if (showDemoWorkspaceDashboard || isStaticDemo) {
      return;
    }

    void refreshLiveHealth();
  }, [isStaticDemo, refreshLiveHealth, showDemoWorkspaceDashboard]);

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
    lastRefreshedAt,
    showDemoWorkspaceDashboard,
    showTechnicalDetails: isShowSystemAdministrationNavEnabled(),
  };
}
