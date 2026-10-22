import type {
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_DISABLED,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED_YET,
  IDENTITY_PROVIDERS_STATUS_NOT_STARTED,
  IDENTITY_PROVIDERS_STATUS_UNKNOWN,
} from "@/lib/identity-providers-settings-copy";

export type IdentityProviderCustomerStatus =
  | typeof IDENTITY_PROVIDERS_STATUS_ENABLED
  | typeof IDENTITY_PROVIDERS_STATUS_DISABLED
  | typeof IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED
  | typeof IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED_YET
  | typeof IDENTITY_PROVIDERS_STATUS_NOT_STARTED
  | typeof IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED
  | typeof IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE
  | typeof IDENTITY_PROVIDERS_STATUS_HEALTHY
  | typeof IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW
  | typeof IDENTITY_PROVIDERS_STATUS_UNKNOWN;

export type IdentityProvidersOverviewTileCaptions = {
  readonly authenticationMode?: string;
  readonly sso?: string;
  readonly saml?: string;
  readonly oidc?: string;
  readonly roleMapping?: string;
  readonly validation?: string;
};

export type IdentityProvidersOverviewModel = {
  readonly authenticationModeLabel: string;
  readonly ssoStatus: IdentityProviderCustomerStatus;
  readonly samlStatus: IdentityProviderCustomerStatus;
  readonly oidcStatus: IdentityProviderCustomerStatus;
  readonly roleMappingStatus: IdentityProviderCustomerStatus;
  readonly validationStatusLabel: string;
  readonly tileCaptions: IdentityProvidersOverviewTileCaptions;
  readonly recommendedNextStep: string;
  readonly recommendedNextHref: string | null;
  readonly usesLocalDevelopmentSignIn: boolean;
  readonly headerStatusAvailable: boolean;
};

export type IdentityProvidersNavId = "overview" | "saml" | "oidc" | "role-mapping" | "diagnostics";
