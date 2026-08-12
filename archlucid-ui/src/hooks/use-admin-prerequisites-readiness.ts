"use client";

import { useEffect, useMemo, useState } from "react";

import { listAwsTier2Connections } from "@/lib/api/aws-cloud-connections-api";
import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { listGcpTier2Connections } from "@/lib/api/gcp-cloud-connections-api";
import { fetchBillingSubscriptionStatus } from "@/lib/billing-subscription-status-client";
import { loadCurrentPrincipal } from "@/lib/current-principal";
import { fetchAdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveAdminPrerequisitesReadiness,
  type AdminPrerequisiteRow,
  type ResolveAdminPrerequisitesReadinessInput,
} from "@/lib/resolve-admin-prerequisites-readiness";
import type { components } from "@/lib/openapi-schemas";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];

export type AdminPrerequisitesReadinessState = {
  readonly phase: "loading" | "ready";
  readonly rows: readonly AdminPrerequisiteRow[];
  readonly allReady: boolean;
};

const INITIAL_FINISH_SETUP_CONTEXT: FinishSetupWizardContext = {
  healthReady: false,
  healthLoadFailed: true,
  principalAdmin: false,
};

async function fetchIdentityDiagnostics(): Promise<{
  readonly identity: ResolveAdminPrerequisitesReadinessInput["identity"];
  readonly identityLoadFailed: boolean;
}> {
  const opts = mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" });

  try {
    const [authConfigRes, identityProviderRes, oidcRes] = await Promise.all([
      fetch("/api/proxy/v1/admin/auth/configuration-diagnostics", opts),
      fetch("/api/proxy/v1/admin/diagnostics/identity-providers", opts),
      fetch("/api/proxy/v1/admin/auth/oidc-diagnostics", opts),
    ]);

    if (!authConfigRes.ok) {
      return { identity: null, identityLoadFailed: true };
    }

    const authConfigurationDiagnostics = (await authConfigRes.json()) as AdminAuthConfigurationDiagnosticsResponse;
    const identityProviderDiagnostics = identityProviderRes.ok
      ? ((await identityProviderRes.json()) as AdminIdentityProviderDiagnosticsResponse)
      : null;
    const oidcDiagnostics = oidcRes.ok ? ((await oidcRes.json()) as AdminOidcDiagnosticsResponse) : null;

    return {
      identity: {
        authConfigurationDiagnostics,
        identityProviderDiagnostics,
        oidcDiagnostics,
      },
      identityLoadFailed: false,
    };
  } catch {
    return { identity: null, identityLoadFailed: true };
  }
}

async function fetchCloudSummary(): Promise<ResolveAdminPrerequisitesReadinessInput["cloud"]> {
  try {
    const [azureConnections, awsConnections, gcpConnections] = await Promise.all([
      listTier2Connections(),
      listAwsTier2Connections(),
      listGcpTier2Connections(),
    ]);

    return {
      anyConfigured: azureConnections.length > 0 || awsConnections.length > 0 || gcpConnections.length > 0,
      loadFailed: false,
    };
  } catch {
    return {
      anyConfigured: false,
      loadFailed: true,
    };
  }
}

/** Loads admin prerequisite probes for the settings hub readiness board (TB-2156). */
export function useAdminPrerequisitesReadiness(enabled: boolean): AdminPrerequisitesReadinessState {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [input, setInput] = useState<ResolveAdminPrerequisitesReadinessInput | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPhase("ready");
      setInput(null);

      return;
    }

    let canceled = false;

    void (async () => {
      setPhase("loading");

      const principal = await loadCurrentPrincipal();
      let healthReady = false;
      let healthLoadFailed = true;

      try {
        const health = await fetchHealthReadySummary();
        healthReady = health !== null && health.status.toLowerCase().includes("healthy");
        healthLoadFailed = health === null;
      } catch {
        healthLoadFailed = true;
      }

      const [configLint, identityDiagnostics, cloud, billingStatus] = await Promise.all([
        fetchAdminConfigLintSummary(),
        fetchIdentityDiagnostics(),
        fetchCloudSummary(),
        fetchBillingSubscriptionStatus().catch(() => null),
      ]);

      if (!canceled) {
        setInput({
          finishSetupContext: {
            healthReady,
            healthLoadFailed,
            principalAdmin: (principal?.authorityRank ?? 0) >= AUTHORITY_RANK.AdminAuthority,
          },
          configLint,
          identity: identityDiagnostics.identity,
          identityLoadFailed: identityDiagnostics.identityLoadFailed,
          cloud,
          billing: {
            paymentPastDue: billingStatus?.isPaymentPastDue === true,
            loadFailed: billingStatus === null,
          },
        });
        setPhase("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return useMemo(() => {
    if (!enabled || input === null) {
      return {
        phase,
        rows: [],
        allReady: false,
      };
    }

    const resolved = resolveAdminPrerequisitesReadiness(input);

    return {
      phase,
      rows: resolved.rows,
      allReady: resolved.allReady,
    };
  }, [enabled, input, phase]);
}
