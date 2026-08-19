"use client";

import { useMemo } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useAdminConfigLintSummaryQuery } from "@/hooks/use-admin-config-lint-summary-query";
import { useAdminIdentityProvidersBundleQuery } from "@/hooks/use-admin-identity-providers-bundle-query";
import { useAdminPrerequisitesCloudSummaryQuery } from "@/hooks/use-admin-prerequisites-cloud-summary-query";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import type { AdminPrerequisitesCloudConnectionsSummary } from "@/lib/fetch-admin-prerequisites-cloud-summary-client";
import type { AdminIdentityProvidersPageBundleResponse } from "@/lib/fetch-identity-providers-page-bundle-client";
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

type IdentityInput = {
  readonly identity: ResolveAdminPrerequisitesReadinessInput["identity"];
  readonly identityLoadFailed: boolean;
};

/**
 * A failed probe resolves to `null`, which must read as "unknown" rather than "not configured".
 * `undefined` only occurs while the query is disabled or pending, which callers gate on.
 */
function toIdentityInput(
  bundle: AdminIdentityProvidersPageBundleResponse | null | undefined,
): IdentityInput {
  if (bundle === null || bundle === undefined) {
    return { identity: null, identityLoadFailed: true };
  }

  return {
    identity: {
      authConfigurationDiagnostics: bundle.authConfigurationDiagnostics,
      authConfigurationDiagnosticsAvailable: true,
      identityProviderDiagnostics: bundle.identityProviderDiagnostics,
      identityProviderDiagnosticsAvailable: true,
      oidcDiagnostics: bundle.oidcDiagnostics,
      oidcDiagnosticsAvailable: true,
    },
    identityLoadFailed: false,
  };
}

function toCloudInput(
  summary: AdminPrerequisitesCloudConnectionsSummary | null | undefined,
): ResolveAdminPrerequisitesReadinessInput["cloud"] {
  if (summary === null || summary === undefined) {
    return { anyConfigured: false, loadFailed: true };
  }

  return { anyConfigured: summary.anyConfigured, loadFailed: false };
}

/**
 * Loads admin prerequisite probes for the settings hub readiness board (TB-2156).
 *
 * Every probe reads through TanStack Query, so the board shares cached responses with the
 * identity, billing, and health surfaces instead of refetching them on each mount.
 */
export function useAdminPrerequisitesReadiness(enabled: boolean): AdminPrerequisitesReadinessState {
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();

  const probesEnabled = enabled && !isAuthorityLoading;
  const includeHostConfigurationLint = isArchLucidInternalOperatorShellEnv();
  const { data: health, isPending: healthPending } = useHealthReadySummaryQuery({
    enabled: probesEnabled,
  });
  const { data: billingStatus, isPending: billingPending } = useBillingSubscriptionStatusQuery({
    enabled: probesEnabled,
  });
  const { data: configLintData, isPending: configLintPending } = useAdminConfigLintSummaryQuery({
    enabled: probesEnabled && includeHostConfigurationLint,
  });
  const { data: identityBundle, isPending: identityPending } = useAdminIdentityProvidersBundleQuery({
    enabled: probesEnabled,
  });
  const { data: cloudSummary, isPending: cloudPending } = useAdminPrerequisitesCloudSummaryQuery({
    enabled: probesEnabled,
  });

  // Config lint only gates readiness on internal hosts, where its query is the only one enabled.
  const probesPending =
    isAuthorityLoading ||
    healthPending ||
    billingPending ||
    identityPending ||
    cloudPending ||
    (includeHostConfigurationLint && configLintPending);

  const authorityRank = currentPrincipal.authorityRank;

  return useMemo(() => {
    if (!enabled) {
      return { phase: "ready", rows: [], allReady: false };
    }

    if (probesPending) {
      return { phase: "loading", rows: [], allReady: false };
    }

    const identityInput = toIdentityInput(identityBundle);
    const finishSetupContext: FinishSetupWizardContext = {
      healthReady:
        health !== null && health !== undefined && health.status.toLowerCase().includes("healthy"),
      healthLoadFailed: health === null,
      principalAdmin: authorityRank >= AUTHORITY_RANK.AdminAuthority,
      identityConfigured: resolveCorporateSignInConfigured(
        identityInput.identity,
        identityInput.identityLoadFailed,
      ),
    };
    const resolved = resolveAdminPrerequisitesReadiness({
      finishSetupContext,
      configLint: includeHostConfigurationLint ? (configLintData ?? null) : null,
      includeHostConfigurationLint,
      identity: identityInput.identity,
      identityLoadFailed: identityInput.identityLoadFailed,
      cloud: toCloudInput(cloudSummary),
      billing: {
        paymentPastDue: billingStatus?.isPaymentPastDue === true,
        loadFailed: billingStatus === null,
      },
    });

    return { phase: "ready", rows: resolved.rows, allReady: resolved.allReady };
  }, [
    authorityRank,
    billingStatus,
    cloudSummary,
    configLintData,
    enabled,
    health,
    identityBundle,
    includeHostConfigurationLint,
    probesPending,
  ]);
}
