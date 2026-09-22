import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { resolveCorporateSignInConfigured } from "@/lib/resolve-corporate-sign-in-configured";
import type { ResolveIdentityProvidersOverviewInput } from "@/lib/resolve-identity-providers-overview";
import {
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";

export const CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED =
  "Status not loaded — open surface to verify" as const;

export type ConfigurationReferenceHelpSurfaceStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export function resolveConfigurationReferenceSsoSurfaceStatus(
  identity: ResolveIdentityProvidersOverviewInput | null,
  identityLoadFailed: boolean,
): ConfigurationReferenceHelpSurfaceStatus {
  const configured = resolveCorporateSignInConfigured(identity, identityLoadFailed);

  if (configured === null) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED };
  }

  if (configured) {
    return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_ENABLED };
  }

  return { kind: "draft", label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED };
}

export function resolveConfigurationReferenceIdentityProvidersSurfaceStatus(
  identity: ResolveIdentityProvidersOverviewInput | null,
  identityLoadFailed: boolean,
): ConfigurationReferenceHelpSurfaceStatus {
  if (identityLoadFailed || identity === null) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED };
  }

  const oidcHealthy = identity.identityProviderDiagnostics?.oidc?.status === "Healthy";
  const samlHealthy = identity.identityProviderDiagnostics?.saml?.status === "Healthy";
  const oidcDiscoveryOk = identity.oidcDiagnostics?.discoverySucceeded === true;

  if (oidcHealthy || samlHealthy || oidcDiscoveryOk) {
    return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_HEALTHY };
  }

  if (identity.authConfigurationDiagnostics?.saml2Enabled === true) {
    return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_ENABLED };
  }

  return { kind: "draft", label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED };
}

export function resolveConfigurationReferenceConfigurationSummarySurfaceStatus(
  configLintAvailable: boolean,
  configLintBlockingCount: number | null,
): ConfigurationReferenceHelpSurfaceStatus {
  if (!configLintAvailable || configLintBlockingCount === null) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED };
  }

  if (configLintBlockingCount === 0) {
    return { kind: "ready", label: "Ready" };
  }

  return { kind: "blocked", label: "Needs attention" };
}
