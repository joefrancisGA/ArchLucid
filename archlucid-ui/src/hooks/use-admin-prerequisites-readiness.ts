"use client";

import { useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useAdminConfigLintSummaryQuery } from "@/hooks/use-admin-config-lint-summary-query";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { listAwsTier2Connections } from "@/lib/api/aws-cloud-connections-api";
import { listTier2Connections } from "@/lib/api/cloud-connections-api";
import { listGcpTier2Connections } from "@/lib/api/gcp-cloud-connections-api";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
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
        authConfigurationDiagnosticsAvailable: true,
        identityProviderDiagnostics,
        identityProviderDiagnosticsAvailable: identityProviderRes.ok,
        oidcDiagnostics,
        oidcDiagnosticsAvailable: oidcRes.ok,
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
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [input, setInput] = useState<ResolveAdminPrerequisitesReadinessInput | null>(null);

  const probesEnabled = enabled && !isAuthorityLoading;
  const includeHostConfigurationLint = isArchLucidInternalOperatorShellEnv();
  const { data: health, isPending: healthPending } = useHealthReadySummaryQuery({ enabled: probesEnabled });
  const { data: billingStatus, isPending: billingPending } = useBillingSubscriptionStatusQuery({
    enabled: probesEnabled,
  });
  const { data: configLintData, isPending: configLintPending } = useAdminConfigLintSummaryQuery({
    enabled: probesEnabled && includeHostConfigurationLint,
  });

  useEffect(() => {
    if (!enabled) {
      setPhase("ready");
      setInput(null);

      return;
    }

    if (isAuthorityLoading || healthPending || billingPending) {
      setPhase("loading");

      return;
    }

    if (includeHostConfigurationLint && configLintPending) {
      setPhase("loading");

      return;
    }

    const healthReady = health !== null && health !== undefined && health.status.toLowerCase().includes("healthy");
    const healthLoadFailed = health === null;
    const finishSetupContext: FinishSetupWizardContext = {
      healthReady,
      healthLoadFailed,
      principalAdmin: currentPrincipal.authorityRank >= AUTHORITY_RANK.AdminAuthority,
    };

    let canceled = false;

    void (async () => {
      setPhase("loading");

      const [identityDiagnostics, cloud] = await Promise.all([
        fetchIdentityDiagnostics(),
        fetchCloudSummary(),
      ]);

      if (!canceled) {
        setInput({
          finishSetupContext,
          configLint: includeHostConfigurationLint ? (configLintData ?? null) : null,
          includeHostConfigurationLint,
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
      canceled = true;
    };
  }, [
    billingPending,
    billingStatus,
    configLintData,
    configLintPending,
    currentPrincipal.authorityRank,
    enabled,
    health,
    healthPending,
    includeHostConfigurationLint,
    isAuthorityLoading,
  ]);

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
