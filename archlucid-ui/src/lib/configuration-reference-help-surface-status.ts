import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { resolveCorporateSignInConfigured } from "@/lib/resolve-corporate-sign-in-configured";
import type { ResolveIdentityProvidersOverviewInput } from "@/lib/resolve-identity-providers-overview";
import {
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";

export const CONFIGURATION_REFERENCE_HELP_STATUS_PENDING = "Status loading…" as const;

export const CONFIGURATION_REFERENCE_HELP_STATUS_FAILED =
  "Status unavailable — open surface to verify" as const;

export const CONFIGURATION_REFERENCE_HELP_STATUS_GATED = "Internal operator shell only" as const;

/** @deprecated Use pending/failed/gated helpers below. */
export const CONFIGURATION_REFERENCE_HELP_STATUS_NOT_LOADED = CONFIGURATION_REFERENCE_HELP_STATUS_FAILED;

export type ConfigurationReferenceHelpSurfaceStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export type ConfigurationReferenceHelpSurfaceStatusInput = {
  readonly identity: ResolveIdentityProvidersOverviewInput | null;
  readonly identityPending: boolean;
  readonly identityLoadFailed: boolean;
};

export function resolveConfigurationReferenceSsoSurfaceStatus(
  input: ConfigurationReferenceHelpSurfaceStatusInput,
): ConfigurationReferenceHelpSurfaceStatus {
  if (input.identityPending) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_PENDING };
  }

  const configured = resolveCorporateSignInConfigured(input.identity, input.identityLoadFailed);

  if (configured === null) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_FAILED };
  }

  if (configured) {
    return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_ENABLED };
  }

  return { kind: "draft", label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED };
}

export function resolveConfigurationReferenceIdentityProvidersSurfaceStatus(
  input: ConfigurationReferenceHelpSurfaceStatusInput,
): ConfigurationReferenceHelpSurfaceStatus {
  if (input.identityPending) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_PENDING };
  }

  if (input.identityLoadFailed || input.identity === null) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_FAILED };
  }

  const oidcHealthy = input.identity.identityProviderDiagnostics?.oidc?.status === "Healthy";
  const samlHealthy = input.identity.identityProviderDiagnostics?.saml?.status === "Healthy";
  const oidcDiscoveryOk = input.identity.oidcDiagnostics?.discoverySucceeded === true;

  if (oidcHealthy || samlHealthy || oidcDiscoveryOk) {
    return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_HEALTHY };
  }

  if (input.identity.authConfigurationDiagnostics?.saml2Enabled === true) {
    return { kind: "ready", label: IDENTITY_PROVIDERS_STATUS_ENABLED };
  }

  return { kind: "draft", label: IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED };
}

export type ConfigurationReferenceConfigurationSummaryStatusInput = {
  readonly includeHostConfigurationLint: boolean;
  readonly configLintPending: boolean;
  readonly configLintAvailable: boolean;
  readonly configLintLoadFailed: boolean;
  readonly configLintBlockingCount: number | null;
};

export function resolveConfigurationReferenceConfigurationSummarySurfaceStatus(
  input: ConfigurationReferenceConfigurationSummaryStatusInput,
): ConfigurationReferenceHelpSurfaceStatus {
  if (!input.includeHostConfigurationLint) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_GATED };
  }

  if (input.configLintPending) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_PENDING };
  }

  if (!input.configLintAvailable || input.configLintLoadFailed || input.configLintBlockingCount === null) {
    return { kind: "neutral", label: CONFIGURATION_REFERENCE_HELP_STATUS_FAILED };
  }

  if (input.configLintBlockingCount === 0) {
    return { kind: "ready", label: "Ready" };
  }

  return { kind: "blocked", label: "Needs attention" };
}
