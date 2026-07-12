import type {
  IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED,
  IDENTITY_PROVIDERS_STATUS_DISABLED,
  IDENTITY_PROVIDERS_STATUS_ENABLED,
  IDENTITY_PROVIDERS_STATUS_HEALTHY,
  IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW,
  IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE,
  IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED,
} from "@/lib/identity-providers-settings-copy";

export type IdentityProviderCustomerStatus =
  | typeof IDENTITY_PROVIDERS_STATUS_ENABLED
  | typeof IDENTITY_PROVIDERS_STATUS_DISABLED
  | typeof IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED
  | typeof IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED
  | typeof IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE
  | typeof IDENTITY_PROVIDERS_STATUS_HEALTHY
  | typeof IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW;

export type IdentityProvidersOverviewModel = {
  readonly authenticationModeLabel: string;
  readonly ssoStatus: IdentityProviderCustomerStatus;
  readonly samlStatus: IdentityProviderCustomerStatus;
  readonly oidcStatus: IdentityProviderCustomerStatus;
  readonly roleMappingStatus: IdentityProviderCustomerStatus;
  readonly lastValidationLabel: string;
  readonly recommendedNextStep: string;
  readonly recommendedNextHref: string | null;
  readonly usesLocalDevelopmentSignIn: boolean;
};

export type IdentityProvidersNavId = "overview" | "saml" | "oidc" | "role-mapping" | "diagnostics";
