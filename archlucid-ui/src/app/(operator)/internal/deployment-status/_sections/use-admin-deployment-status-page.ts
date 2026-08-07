"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type AdminDeploymentStatusResponse,
  buildDeploymentStatusRequestUrl,
} from "@/lib/admin-deployment-status";
import { readClientDeploymentFingerprint } from "@/lib/deployment-fingerprint";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import type { AdminDeploymentStatusPageViewModel } from "./admin-deployment-status-view-model";
import type { AdminDeploymentStatusPageServerLoad } from "./load-admin-deployment-status-page-data";

export function useAdminDeploymentStatusPage(
  loaded: AdminDeploymentStatusPageServerLoad,
): AdminDeploymentStatusPageViewModel {
  const isDemo = loaded.demo;
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AdminDeploymentStatusResponse | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo) {
      return;
    }

    setLoading(true);
    setError(null);

    const fingerprint = readClientDeploymentFingerprint();
    const url = buildDeploymentStatusRequestUrl(fingerprint.frontendCommitSha);
    const init = mergeRegistrationScopeForProxy({
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    try {
      const response = await fetch(url, init);

      if (response.status === 401 || response.status === 403) {
        setStatus(null);
        setError(`Deployment status requires administrator access (HTTP ${response.status}).`);
        return;
      }

      if (!response.ok) {
        setStatus(null);
        setError(`Deployment status request failed (HTTP ${response.status}).`);
        return;
      }

      const body = (await response.json()) as AdminDeploymentStatusResponse;
      setStatus(body);
      setLastRefreshedAt(new Date());
    } catch {
      setStatus(null);
      setError("Deployment status request failed (network error).");
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    isDemo,
    loading,
    error,
    status,
    lastRefreshedAt,
    refresh,
  };
}
