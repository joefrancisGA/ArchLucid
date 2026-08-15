"use client";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useAdminIdentityProvidersBundleQuery } from "@/hooks/use-admin-identity-providers-bundle-query";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import type { AdminIdentityProvidersPageBundleResponse } from "@/lib/fetch-identity-providers-page-bundle-client";
import {
  countFinishSetupReadySteps,
  type FinishSetupWizardContext,
} from "@/lib/finish-setup-wizard-steps";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveCorporateSignInConfigured } from "@/lib/resolve-corporate-sign-in-configured";
import type { ResolveIdentityProvidersOverviewInput } from "@/lib/resolve-identity-providers-overview";

export type FinishSetupReadinessSummary = {
  readonly phase: "loading" | "ready";
  readonly context: FinishSetupWizardContext | null;
  readonly readyCount: number;
  readonly totalCount: number;
};

const INITIAL_CONTEXT: FinishSetupWizardContext = {
  healthReady: false,
  healthLoadFailed: true,
  principalAdmin: false,
  identityConfigured: null,
};

function toIdentityOverviewInput(
  bundle: AdminIdentityProvidersPageBundleResponse | null | undefined,
): ResolveIdentityProvidersOverviewInput | null {
  if (bundle === null || bundle === undefined) {
    return null;
  }

  return {
    authConfigurationDiagnostics: bundle.authConfigurationDiagnostics,
    authConfigurationDiagnosticsAvailable: true,
    identityProviderDiagnostics: bundle.identityProviderDiagnostics,
    identityProviderDiagnosticsAvailable: true,
    oidcDiagnostics: bundle.oidcDiagnostics,
    oidcDiagnosticsAvailable: true,
  };
}

/** Loads health + principal + identity signals used by finish-setup readiness and operator-home metrics. */
export function useFinishSetupReadinessContext(): FinishSetupReadinessSummary {
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const { data: health, isPending: healthPending } = useHealthReadySummaryQuery();
  const principalAdmin = currentPrincipal.authorityRank >= AUTHORITY_RANK.AdminAuthority;
  const identityProbeEnabled = !isAuthorityLoading && principalAdmin;
  const { data: identityBundle, isPending: identityPending } = useAdminIdentityProvidersBundleQuery({
    enabled: identityProbeEnabled,
  });

  const healthReady = health !== null && health !== undefined && health.status.toLowerCase().includes("healthy");
  const healthLoadFailed = !healthPending && health === null;
  const identityStillLoading = identityProbeEnabled && identityPending;
  const phase = isAuthorityLoading || healthPending || identityStillLoading ? "loading" : "ready";
  const identityOverviewInput = toIdentityOverviewInput(identityBundle);
  const context: FinishSetupWizardContext =
    phase === "ready"
      ? {
          healthReady,
          healthLoadFailed,
          principalAdmin,
          // Non-admins cannot read identity diagnostics, so their signal stays unknown (`null`).
          identityConfigured: identityProbeEnabled
            ? resolveCorporateSignInConfigured(identityOverviewInput, identityOverviewInput === null)
            : null,
        }
      : INITIAL_CONTEXT;
  const counts = countFinishSetupReadySteps(context);

  return {
    phase,
    context: phase === "ready" ? context : null,
    readyCount: counts.ready,
    totalCount: counts.total,
  };
}
