"use client";

import { useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useAdminConfigLintSummaryQuery } from "@/hooks/use-admin-config-lint-summary-query";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { fetchAdminPrerequisitesCloudConnectionsSummary } from "@/lib/fetch-admin-prerequisites-cloud-summary-client";
import { fetchIdentityProvidersPageBundle } from "@/lib/fetch-identity-providers-page-bundle-client";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { resolveCorporateSignInConfigured } from "@/lib/resolve-corporate-sign-in-configured";
import {
  resolveAdminPrerequisitesReadiness,
  type AdminPrerequisiteRow,
  type ResolveAdminPrerequisitesReadinessInput,
} from "@/lib/resolve-admin-prerequisites-readiness";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

export type AdminPrerequisitesReadinessState = {
  readonly phase: "loading" | "ready";
  readonly rows: readonly AdminPrerequisiteRow[];
  readonly allReady: boolean;
};

async function fetchIdentityDiagnostics(): Promise<{
  readonly identity: ResolveAdminPrerequisitesReadinessInput["identity"];
  readonly identityLoadFailed: boolean;
}> {
  try {
    const bundle = await fetchIdentityProvidersPageBundle();
    const authConfigurationDiagnostics = bundle.authConfigurationDiagnostics ?? null;
    const identityProviderDiagnostics = bundle.identityProviderDiagnostics ?? null;
    const oidcDiagnostics = bundle.oidcDiagnostics ?? null;

    return {
      identity: {
        authConfigurationDiagnostics,
        authConfigurationDiagnosticsAvailable: authConfigurationDiagnostics !== null,
        identityProviderDiagnostics,
        identityProviderDiagnosticsAvailable: identityProviderDiagnostics !== null,
        oidcDiagnostics,
        oidcDiagnosticsAvailable: oidcDiagnostics !== null,
      },
      identityLoadFailed: false,
    };
  } catch {
    return { identity: null, identityLoadFailed: true };
  }
}

async function fetchCloudSummary(): Promise<ResolveAdminPrerequisitesReadinessInput["cloud"]> {
  try {
    const summary = await fetchAdminPrerequisitesCloudConnectionsSummary();

    return {
      anyConfigured: summary.anyConfigured,
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
    let canceled = false;

    void (async () => {
      setPhase("loading");

      const [identityDiagnostics, cloud] = await Promise.all([
        fetchIdentityDiagnostics(),
        fetchCloudSummary(),
      ]);
      const finishSetupContext: FinishSetupWizardContext = {
        healthReady,
        healthLoadFailed,
        principalAdmin: currentPrincipal.authorityRank >= AUTHORITY_RANK.AdminAuthority,
        identityConfigured: resolveCorporateSignInConfigured(
          identityDiagnostics.identity,
          identityDiagnostics.identityLoadFailed,
        ),
      };

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
