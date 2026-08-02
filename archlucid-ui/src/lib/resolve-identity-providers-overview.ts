import type { components } from "@/lib/openapi-schemas";
import {
  IDENTITY_PROVIDERS_AUTH_MODE_API_KEY,
  IDENTITY_PROVIDERS_AUTH_MODE_LOCAL_DEV,
  IDENTITY_PROVIDERS_AUTH_MODE_OIDC,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML,
  IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_OIDC,
  IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING,
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_DISABLED,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";
import type { IdentityProviderCustomerStatus, IdentityProvidersOverviewModel } from "@/lib/identity-providers-settings-types";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];

export type ResolveIdentityProvidersOverviewInput = {
  readonly authConfigurationDiagnostics: AdminAuthConfigurationDiagnosticsResponse | null;
  readonly identityProviderDiagnostics: AdminIdentityProviderDiagnosticsResponse | null;
  readonly oidcDiagnostics: AdminOidcDiagnosticsResponse | null;
};

function mapAuthModeLabel(authMode: string | null | undefined): string {
  switch (authMode) {
    case "DevelopmentBypass":
      return IDENTITY_PROVIDERS_AUTH_MODE_LOCAL_DEV;
    case "JwtBearer":
      return IDENTITY_PROVIDERS_AUTH_MODE_OIDC;
    case "ApiKey":
      return IDENTITY_PROVIDERS_AUTH_MODE_API_KEY;
    default:
      return authMode?.trim() || IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;
  }
}

function probeStatusToCustomerStatus(status: string | undefined): IdentityProviderCustomerStatus {
  switch (status) {
    case "Healthy":
      return IDENTITY_PROVIDERS_STATUS_HEALTHY;
    case "Degraded":
    case "Unreachable":
      return IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
    case "NotApplicable":
      return IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE;
    default:
      return IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;
  }
}

function resolveSamlStatus(config: AdminAuthConfigurationDiagnosticsResponse | null): IdentityProviderCustomerStatus {
  if (config?.saml2Enabled === true) {
    if (config.tenantIdentityProviderProtocol === "Saml") {
      return IDENTITY_PROVIDERS_STATUS_ENABLED;
    }

    return IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
  }

  if (config?.tenantIdentityProviderProtocol === "Saml") {
    return IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED;
  }

  return IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;
}

function resolveOidcStatus(
  config: AdminAuthConfigurationDiagnosticsResponse | null,
  oidcDiagnostics: AdminOidcDiagnosticsResponse | null,
  identityProviderDiagnostics: AdminIdentityProviderDiagnosticsResponse | null,
): IdentityProviderCustomerStatus {
  if (config?.authMode === "ApiKey") {
    return IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE;
  }

  if (config?.authMode === "DevelopmentBypass") {
    return IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;
  }

  if (oidcDiagnostics?.discoverySucceeded === true) {
    return IDENTITY_PROVIDERS_STATUS_HEALTHY;
  }

  if (oidcDiagnostics?.discoverySucceeded === false) {
    return IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
  }

  const probeStatus = identityProviderDiagnostics?.oidc?.status;

  return probeStatusToCustomerStatus(probeStatus);
}

function resolveRoleMappingStatus(config: AdminAuthConfigurationDiagnosticsResponse | null): IdentityProviderCustomerStatus {
  if (config?.roleClaimNameConfigured === true && config?.tenantClaimMappingConfigured === true) {
    return IDENTITY_PROVIDERS_STATUS_ENABLED;
  }

  if (config?.roleClaimNameConfigured === true) {
    return IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
  }

  if (config?.authMode === "DevelopmentBypass") {
    return IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE;
  }

  return IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED;
}

function resolveSsoStatus(
  samlStatus: IdentityProviderCustomerStatus,
  oidcStatus: IdentityProviderCustomerStatus,
): IdentityProviderCustomerStatus {
  if (samlStatus === IDENTITY_PROVIDERS_STATUS_ENABLED || oidcStatus === IDENTITY_PROVIDERS_STATUS_HEALTHY) {
    return IDENTITY_PROVIDERS_STATUS_ENABLED;
  }

  if (
    samlStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW
    || oidcStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW
    || samlStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED
    || oidcStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED
  ) {
    return IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED;
  }

  if (samlStatus === IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED && oidcStatus === IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED) {
    return IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;
  }

  return IDENTITY_PROVIDERS_STATUS_DISABLED;
}

function resolveRecommendedNextStep(
  config: AdminAuthConfigurationDiagnosticsResponse | null,
  samlStatus: IdentityProviderCustomerStatus,
  oidcStatus: IdentityProviderCustomerStatus,
  roleMappingStatus: IdentityProviderCustomerStatus,
): { readonly step: string; readonly href: string | null } {
  if (config?.authMode === "DevelopmentBypass") {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
      href: "/administration/settings/identity-providers/oidc",
    };
  }

  if (samlStatus === IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED || samlStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED) {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML,
      href: "/administration/settings/identity-providers/saml",
    };
  }

  if (roleMappingStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED || roleMappingStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW) {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING,
      href: "/administration/settings/identity-providers/role-mapping",
    };
  }

  if (oidcStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW) {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_OIDC,
      href: "/administration/settings/identity-providers/oidc",
    };
  }

  return {
    step: IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING,
    href: "/administration/settings/identity-providers/diagnostics",
  };
}

/** Derives buyer-safe overview status cards from admin diagnostics payloads. */
export function resolveIdentityProvidersOverview(
  input: ResolveIdentityProvidersOverviewInput,
): IdentityProvidersOverviewModel {
  const config = input.authConfigurationDiagnostics;
  const samlStatus = resolveSamlStatus(config);
  const oidcStatus = resolveOidcStatus(config, input.oidcDiagnostics, input.identityProviderDiagnostics);
  const roleMappingStatus = resolveRoleMappingStatus(config);
  const ssoStatus = resolveSsoStatus(samlStatus, oidcStatus);
  const recommended = resolveRecommendedNextStep(config, samlStatus, oidcStatus, roleMappingStatus);

  let lastValidationLabel = IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;

  if (input.oidcDiagnostics?.discoverySucceeded === true) {
    lastValidationLabel = IDENTITY_PROVIDERS_STATUS_HEALTHY;
  } else if (input.oidcDiagnostics?.discoverySucceeded === false) {
    lastValidationLabel = IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
  } else if (samlStatus === IDENTITY_PROVIDERS_STATUS_ENABLED) {
    lastValidationLabel = IDENTITY_PROVIDERS_STATUS_ENABLED;
  }

  return {
    authenticationModeLabel: mapAuthModeLabel(config?.authMode),
    ssoStatus,
    samlStatus,
    oidcStatus,
    roleMappingStatus,
    lastValidationLabel,
    recommendedNextStep: recommended.step,
    recommendedNextHref: recommended.href,
    usesLocalDevelopmentSignIn: config?.authMode === "DevelopmentBypass",
  };
}

/** Whether raw configuration diagnostics should be visible in the UI. */
export function canViewIdentityProviderTechnicalDiagnostics(isInternalOperatorShell: boolean): boolean {
  return isInternalOperatorShell;
}
