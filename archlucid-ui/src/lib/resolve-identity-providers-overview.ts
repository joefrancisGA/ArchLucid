import type { components } from "@/lib/openapi-schemas";
import {
  IDENTITY_PROVIDERS_AUTH_MODE_API_KEY,
  IDENTITY_PROVIDERS_AUTH_MODE_LOCAL_DEV,
  IDENTITY_PROVIDERS_AUTH_MODE_OIDC,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN,
  IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML,
  IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_OIDC,
  IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING,
  IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON,
  IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_DISABLED,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
  IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE,
  IDENTITY_PROVIDERS_STATUS_UNKNOWN,
  IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET,
} from "@/lib/identity-providers-settings-copy";
import type {
  IdentityProviderCustomerStatus,
  IdentityProvidersOverviewModel,
  IdentityProvidersOverviewTileCaptions,
} from "@/lib/identity-providers-settings-types";

type AdminAuthConfigurationDiagnosticsResponse =
  components["schemas"]["AdminAuthConfigurationDiagnosticsResponse"];
type AdminIdentityProviderDiagnosticsResponse =
  components["schemas"]["AdminIdentityProviderDiagnosticsResponse"];
type AdminOidcDiagnosticsResponse = components["schemas"]["AdminOidcDiagnosticsResponse"];

export type ResolveIdentityProvidersOverviewInput = {
  readonly authConfigurationDiagnostics: AdminAuthConfigurationDiagnosticsResponse | null;
  readonly authConfigurationDiagnosticsAvailable: boolean;
  readonly identityProviderDiagnostics: AdminIdentityProviderDiagnosticsResponse | null;
  readonly identityProviderDiagnosticsAvailable: boolean;
  readonly oidcDiagnostics: AdminOidcDiagnosticsResponse | null;
  readonly oidcDiagnosticsAvailable: boolean;
};

function unknownCaption(): string {
  return IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE;
}

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
  oidcDiagnosticsAvailable: boolean,
  identityProviderDiagnosticsAvailable: boolean,
): IdentityProviderCustomerStatus {
  if (!oidcDiagnosticsAvailable && !identityProviderDiagnosticsAvailable) {
    return IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  }

  if (config?.authMode === "ApiKey") {
    return IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE;
  }

  if (config?.authMode === "DevelopmentBypass") {
    return IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED;
  }

  if (oidcDiagnosticsAvailable && oidcDiagnostics?.discoverySucceeded === true) {
    return IDENTITY_PROVIDERS_STATUS_HEALTHY;
  }

  if (oidcDiagnosticsAvailable && oidcDiagnostics?.discoverySucceeded === false) {
    return IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
  }

  if (identityProviderDiagnosticsAvailable) {
    const probeStatus = identityProviderDiagnostics?.oidc?.status;

    return probeStatusToCustomerStatus(probeStatus);
  }

  return IDENTITY_PROVIDERS_STATUS_UNKNOWN;
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
  if (samlStatus === IDENTITY_PROVIDERS_STATUS_UNKNOWN || oidcStatus === IDENTITY_PROVIDERS_STATUS_UNKNOWN) {
    return IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  }

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
      href: IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF,
    };
  }

  if (samlStatus === IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED || samlStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED) {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML,
      href: "/administration/identity-providers/saml",
    };
  }

  if (roleMappingStatus === IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED || roleMappingStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW) {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING,
      href: "/administration/identity-providers/role-mapping",
    };
  }

  if (oidcStatus === IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW) {
    return {
      step: IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_OIDC,
      href: "/administration/identity-providers/oidc",
    };
  }

  return {
    step: IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING,
    href: "/administration/identity-providers/diagnostics",
  };
}

function resolveValidationStatusLabel(
  input: ResolveIdentityProvidersOverviewInput,
  samlStatus: IdentityProviderCustomerStatus,
): string {
  if (!input.oidcDiagnosticsAvailable && !input.authConfigurationDiagnosticsAvailable) {
    return IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  }

  if (input.oidcDiagnosticsAvailable && input.oidcDiagnostics?.discoverySucceeded === true) {
    return IDENTITY_PROVIDERS_STATUS_HEALTHY;
  }

  if (input.oidcDiagnosticsAvailable && input.oidcDiagnostics?.discoverySucceeded === false) {
    return IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;
  }

  if (input.authConfigurationDiagnosticsAvailable && samlStatus === IDENTITY_PROVIDERS_STATUS_ENABLED) {
    return IDENTITY_PROVIDERS_STATUS_ENABLED;
  }

  if (!input.oidcDiagnosticsAvailable) {
    return IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  }

  return IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET;
}

function buildTileCaptions(
  input: ResolveIdentityProvidersOverviewInput,
  roleMappingStatus: IdentityProviderCustomerStatus,
  authModeLabel: string,
  samlStatus: IdentityProviderCustomerStatus,
  oidcStatus: IdentityProviderCustomerStatus,
  ssoStatus: IdentityProviderCustomerStatus,
  validationStatusLabel: string,
): IdentityProvidersOverviewTileCaptions {
  const captions: {
    authenticationMode?: string;
    sso?: string;
    saml?: string;
    oidc?: string;
    roleMapping?: string;
    validation?: string;
  } = {};

  if (!input.authConfigurationDiagnosticsAvailable) {
    captions.authenticationMode = unknownCaption();
    captions.saml = unknownCaption();
    captions.roleMapping = unknownCaption();
    captions.sso = unknownCaption();
  }

  if (!input.oidcDiagnosticsAvailable && !input.identityProviderDiagnosticsAvailable) {
    captions.oidc = unknownCaption();
  }

  if (
    input.authConfigurationDiagnosticsAvailable
    && roleMappingStatus === IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE
    && input.authConfigurationDiagnostics?.authMode === "DevelopmentBypass"
  ) {
    captions.roleMapping = IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON;
  }

  if (validationStatusLabel === IDENTITY_PROVIDERS_STATUS_UNKNOWN) {
    captions.validation = unknownCaption();
  }

  if (authModeLabel === IDENTITY_PROVIDERS_STATUS_UNKNOWN) {
    captions.authenticationMode = unknownCaption();
  }

  if (samlStatus === IDENTITY_PROVIDERS_STATUS_UNKNOWN) {
    captions.saml = unknownCaption();
  }

  if (oidcStatus === IDENTITY_PROVIDERS_STATUS_UNKNOWN) {
    captions.oidc = unknownCaption();
  }

  if (ssoStatus === IDENTITY_PROVIDERS_STATUS_UNKNOWN) {
    captions.sso = unknownCaption();
  }

  return captions;
}

/** Derives buyer-safe overview status cards from admin diagnostics payloads. */
export function resolveIdentityProvidersOverview(
  input: ResolveIdentityProvidersOverviewInput,
): IdentityProvidersOverviewModel {
  const config = input.authConfigurationDiagnosticsAvailable ? input.authConfigurationDiagnostics : null;
  const samlStatus = input.authConfigurationDiagnosticsAvailable
    ? resolveSamlStatus(config)
    : IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  const oidcStatus = input.authConfigurationDiagnosticsAvailable
    ? resolveOidcStatus(
        config,
        input.oidcDiagnostics,
        input.identityProviderDiagnostics,
        input.oidcDiagnosticsAvailable,
        input.identityProviderDiagnosticsAvailable,
      )
    : IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  const roleMappingStatus = input.authConfigurationDiagnosticsAvailable
    ? resolveRoleMappingStatus(config)
    : IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  const ssoStatus = resolveSsoStatus(samlStatus, oidcStatus);
  const recommended = resolveRecommendedNextStep(config, samlStatus, oidcStatus, roleMappingStatus);
  const authenticationModeLabel = input.authConfigurationDiagnosticsAvailable
    ? mapAuthModeLabel(config?.authMode)
    : IDENTITY_PROVIDERS_STATUS_UNKNOWN;
  const validationStatusLabel = resolveValidationStatusLabel(input, samlStatus);
  const tileCaptions = buildTileCaptions(
    input,
    roleMappingStatus,
    authenticationModeLabel,
    samlStatus,
    oidcStatus,
    ssoStatus,
    validationStatusLabel,
  );

  return {
    authenticationModeLabel,
    ssoStatus,
    samlStatus,
    oidcStatus,
    roleMappingStatus,
    validationStatusLabel,
    tileCaptions,
    recommendedNextStep: recommended.step,
    recommendedNextHref: recommended.href,
    usesLocalDevelopmentSignIn: config?.authMode === "DevelopmentBypass",
    headerStatusAvailable: input.authConfigurationDiagnosticsAvailable,
  };
}

/** Whether raw configuration diagnostics should be visible in the UI. */
export function canViewIdentityProviderTechnicalDiagnostics(isInternalOperatorShell: boolean): boolean {
  return isInternalOperatorShell;
}
