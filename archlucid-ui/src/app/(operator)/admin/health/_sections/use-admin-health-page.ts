"use client";

import { useCallback, useEffect, useState } from "react";

import {
  findCircuitBreakersEntry,
  type HealthDetailedResponse,
  type HealthReadyResponse,
  type OperatorTaskSuccessRatesResponse,
  parseCircuitGatesFromHealthEntry,
  type CircuitGateRow,
  type VersionInfoResponse,
} from "@/lib/health-dashboard-types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import {
  ADMIN_HEALTH_CONFIG_LINT_PATH,
  ADMIN_HEALTH_DIAGNOSTICS_PATH,
  ADMIN_HEALTH_OPERATOR_RATES_PATH,
  ADMIN_HEALTH_READY_PATH,
  ADMIN_HEALTH_VERSION_PATH,
} from "./admin-health-constants";
import type { AdminHealthConfigLintPayload } from "./admin-health-types";
import type { AdminHealthPageViewModel } from "./admin-health-view-model";
import type { AdminHealthPageServerLoad } from "./load-admin-health-page-data";

export function useAdminHealthPage(loaded: AdminHealthPageServerLoad): AdminHealthPageViewModel {
  const isDemo = loaded.demo;

  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState<HealthReadyResponse | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [version, setVersion] = useState<VersionInfoResponse | null>(null);
  const [circuitNote, setCircuitNote] = useState<string | null>(null);
  const [circuitGates, setCircuitGates] = useState<CircuitGateRow[]>([]);
  const [rates, setRates] = useState<OperatorTaskSuccessRatesResponse | null>(null);
  const [ratesNote, setRatesNote] = useState<string | null>(null);
  const [configLint, setConfigLint] = useState<AdminHealthConfigLintPayload | null>(null);
  const [configLintNote, setConfigLintNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setReadyError(null);
    setCircuitNote(null);
    setRatesNote(null);
    setConfigLintNote(null);

    const jsonInit = mergeRegistrationScopeForProxy({
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    try {
      const [readyRes, versionRes, healthRes, ratesRes, lintRes] = await Promise.all([
        fetch(ADMIN_HEALTH_READY_PATH, jsonInit),
        fetch(ADMIN_HEALTH_VERSION_PATH, jsonInit),
        fetch(ADMIN_HEALTH_DIAGNOSTICS_PATH, jsonInit),
        fetch(ADMIN_HEALTH_OPERATOR_RATES_PATH, jsonInit),
        fetch(ADMIN_HEALTH_CONFIG_LINT_PATH, jsonInit),
      ]);

      if (readyRes.ok) {
        const r = (await readyRes.json()) as HealthReadyResponse;
        setReady(r);
      } else {
        setReady(null);
        setReadyError(`Readiness check failed (HTTP ${readyRes.status}).`);
      }

      if (versionRes.ok) {
        setVersion((await versionRes.json()) as VersionInfoResponse);
      } else {
        setVersion(null);
      }

      if (healthRes.status === 401 || healthRes.status === 403) {
        setCircuitGates([]);
        setCircuitNote(
          "Circuit breaker detail requires API authentication. Sign in with Read access (or use DevelopmentBypass with a valid scope) to load full health JSON.",
        );
      } else if (healthRes.ok) {
        const h = (await healthRes.json()) as HealthDetailedResponse;
        const cb = findCircuitBreakersEntry(h.entries);

        if (cb !== null) {
          setCircuitGates(parseCircuitGatesFromHealthEntry(cb.data as Record<string, unknown> | null | undefined));
        } else {
          setCircuitGates([]);
        }
      } else {
        setCircuitGates([]);
        setCircuitNote(`Full health report unavailable (HTTP ${healthRes.status}).`);
      }

      if (ratesRes.ok) {
        setRates((await ratesRes.json()) as OperatorTaskSuccessRatesResponse);
      } else {
        setRates(null);
        setRatesNote("Endpoint not yet available or not authorized — onboarding metrics require a successful `ReadAuthority` session.");
      }

      if (lintRes.ok) {
        setConfigLint((await lintRes.json()) as AdminHealthConfigLintPayload);
        setConfigLintNote(null);
      } else {
        setConfigLint(null);
        setConfigLintNote(
          lintRes.status === 401 || lintRes.status === 403
            ? "Config lint requires an Admin session — sign in with a tenant administrator account."
            : `Config lint unavailable (HTTP ${lintRes.status}).`,
        );
      }
    } catch (e) {
      setReadyError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void refresh();
  }, [isDemo, refresh]);

  return {
    isDemo,
    loading,
    refresh,
    ready,
    readyError,
    version,
    circuitNote,
    circuitGates,
    rates,
    ratesNote,
    configLint,
    configLintNote,
  };
}
