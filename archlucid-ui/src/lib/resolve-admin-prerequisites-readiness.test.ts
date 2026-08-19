import { describe, expect, it } from "vitest";

import type { AdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import {
  ADMIN_PREREQUISITE_SORT_ORDER,
  resolveAdminPrerequisitesReadiness,
  type ResolveAdminPrerequisitesReadinessInput,
} from "@/lib/resolve-admin-prerequisites-readiness";

const MANAGED_SAAS_DEPLOYMENT = { selfHosted: false } as const;

const SELF_HOSTED_DEPLOYMENT = { selfHosted: true } as const;

function buildInput(
  overrides: Partial<ResolveAdminPrerequisitesReadinessInput> = {},
): ResolveAdminPrerequisitesReadinessInput {
  const finishSetupContext: FinishSetupWizardContext = {
    healthReady: false,
    healthLoadFailed: false,
    principalAdmin: false,
    ...overrides.finishSetupContext,
  };

  const configLint: AdminConfigLintSummary = {
    blockingCount: 1,
    advisoryCount: 0,
    loadFailed: false,
    ...overrides.configLint,
  };

  return {
    finishSetupContext,
    configLint: overrides.configLint === null ? null : configLint,
    identity: overrides.identity ?? {
      authConfigurationDiagnostics: {
        authMode: "DevelopmentBypass",
        saml2Enabled: false,
        tenantIdentityProviderProtocol: null,
        roleClaimNameConfigured: false,
        tenantClaimMappingConfigured: false,
      },
      identityProviderDiagnostics: null,
      oidcDiagnostics: null,
    },
    identityLoadFailed: overrides.identityLoadFailed ?? false,
    cloud: overrides.cloud ?? { anyConfigured: false, loadFailed: false },
    billing: overrides.billing ?? { paymentPastDue: false, loadFailed: false },
    deployment: overrides.deployment ?? MANAGED_SAAS_DEPLOYMENT,
    includeHostConfigurationLint: overrides.includeHostConfigurationLint,
  };
}

describe("resolveAdminPrerequisitesReadiness (TB-2156)", () => {
  it("orders unmet managed-SaaS prerequisites by dependency", () => {
    const result = resolveAdminPrerequisitesReadiness(buildInput());

    expect(result.allReady).toBe(false);
    expect(result.rows.map((row) => row.id)).toEqual([
      "cloud-connection",
      "corporate-sign-in",
      "admin-role",
    ]);
    expect(result.rows[0]?.sortOrder).toBe(ADMIN_PREREQUISITE_SORT_ORDER.cloudConnection);
    expect(result.rows[1]?.sortOrder).toBe(ADMIN_PREREQUISITE_SORT_ORDER.corporateSignIn);
    expect(result.rows[2]?.sortOrder).toBe(ADMIN_PREREQUISITE_SORT_ORDER.adminRole);
  });

  it("includes self-hosted platform health before other prerequisites", () => {
    const result = resolveAdminPrerequisitesReadiness(
      buildInput({
        deployment: SELF_HOSTED_DEPLOYMENT,
        finishSetupContext: {
          healthReady: false,
          healthLoadFailed: false,
          principalAdmin: false,
        },
      }),
    );

    expect(result.rows[0]?.id).toBe("platform-health");
  });

  it("returns compact ready state when mandatory prerequisites are satisfied", () => {
    const result = resolveAdminPrerequisitesReadiness(
      buildInput({
        finishSetupContext: {
          healthReady: true,
          healthLoadFailed: false,
          principalAdmin: true,
        },
        configLint: {
          blockingCount: 0,
          advisoryCount: 0,
          loadFailed: false,
        },
        identity: {
          authConfigurationDiagnostics: {
            authMode: "JwtBearer",
            saml2Enabled: false,
            tenantIdentityProviderProtocol: "Oidc",
            roleClaimNameConfigured: true,
            tenantClaimMappingConfigured: true,
          },
          authConfigurationDiagnosticsAvailable: true,
          identityProviderDiagnostics: null,
          identityProviderDiagnosticsAvailable: false,
          oidcDiagnostics: {
            discoverySucceeded: true,
          },
          oidcDiagnosticsAvailable: true,
        },
        cloud: { anyConfigured: false, loadFailed: false },
      }),
    );

    expect(result.allReady).toBe(true);
    expect(result.rows).toHaveLength(0);
  });

  it("includes host config-lint only for the internal operator shell", () => {
    const tenantAdmin = resolveAdminPrerequisitesReadiness(buildInput());
    const internal = resolveAdminPrerequisitesReadiness(
      buildInput({ includeHostConfigurationLint: true }),
    );

    expect(tenantAdmin.rows.some((row) => row.id === "production-config")).toBe(false);
    expect(internal.rows[0]?.id).toBe("production-config");
  });

  it("collapses optional cloud connection while blocking config findings remain", () => {
    const result = resolveAdminPrerequisitesReadiness(
      buildInput({
        includeHostConfigurationLint: true,
        configLint: {
          blockingCount: 2,
          advisoryCount: 0,
          loadFailed: false,
        },
        cloud: { anyConfigured: false, loadFailed: false },
      }),
    );

    expect(result.rows.some((row) => row.id === "cloud-connection")).toBe(false);
  });

  it("surfaces billing when subscription payment is past due", () => {
    const result = resolveAdminPrerequisitesReadiness(
      buildInput({
        billing: { paymentPastDue: true, loadFailed: false },
      }),
    );

    expect(result.rows.some((row) => row.id === "billing-payment")).toBe(true);
  });
});
