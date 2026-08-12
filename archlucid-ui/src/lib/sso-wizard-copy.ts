import { IDENTITY_PROVIDERS_PAGE_TITLE } from "@/lib/identity-providers-settings-copy";

export const SSO_WIZARD_PAGE_TITLE = "Configure single sign-on";

export const SSO_WIZARD_PAGE_INTRO =
  "Record and verify your organization's identity provider configuration and role mapping for every workspace in this organization.";

export const SSO_WIZARD_CONFIGURATION_EFFECT_LINE =
  "Saving configuration writes your verified identity provider settings and role mapping to the identity provider record for every workspace in this organization. It does not change how anyone signs in today — turning on SSO sign-in is a separate platform configuration change.";

/** @deprecated Use SSO_WIZARD_CONFIGURATION_EFFECT_LINE — kept for drift guards. */
export const SSO_WIZARD_STATUS_NOT_ACTIVE = SSO_WIZARD_CONFIGURATION_EFFECT_LINE;

/** @deprecated Use SSO_WIZARD_CONFIGURATION_EFFECT_LINE — kept for drift guards. */
export const SSO_WIZARD_TRUST_REASSURANCE = SSO_WIZARD_CONFIGURATION_EFFECT_LINE;

export const SSO_WIZARD_BACK_LINK_LABEL = "Back to identity providers";

export const SSO_WIZARD_IDENTITY_PROVIDERS_HREF = "/administration/identity-providers";

export const SSO_WIZARD_SETTINGS_HREF = "/administration";

export const SSO_WIZARD_BREADCRUMB_CONFIGURE = "Configure SSO";

export const SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE =
  "How this relates to identity providers and SCIM provisioning";

export const SSO_WIZARD_IDP_STEP_HEADING = "Choose your identity provider";

export const SSO_WIZARD_IDP_STEP_INSTRUCTION =
  "Select the directory or SSO product your organization uses. We will suggest a protocol next.";

export const SSO_WIZARD_PROTOCOL_STEP_HEADING = "Choose a protocol";

export const SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION =
  "Select the protocol supported by your identity provider.";

export const SSO_WIZARD_PROTOCOL_REQUIRED_HELPER =
  "Select OpenID Connect or SAML 2.0 to continue.";

export const SSO_WIZARD_PROTOCOL_HELP_SUMMARY = "Not sure which protocol to choose?";

export const SSO_WIZARD_PROTOCOL_HELP_BODY =
  "Choose OpenID Connect when your provider supports it and you are setting up a new integration. Choose SAML 2.0 when required by your identity provider or an existing enterprise federation standard.";

export const SSO_WIZARD_CANCEL_LABEL = "Cancel";

export const SSO_WIZARD_CONTINUE_LABEL = "Continue";

export const SSO_WIZARD_BACK_STEP_LABEL = "Back";

export const SSO_WIZARD_ACTIVATE_LABEL = "Save configuration";

export const SSO_WIZARD_ACTIVATING_LABEL = "Saving…";

export const SSO_WIZARD_CANCEL_UNSAVED_CONFIRM =
  "Discard your in-progress SSO configuration and return to identity providers?";

export const SSO_WIZARD_ACTIVATE_INTRO =
  "Review your settings, then save this verified identity provider configuration to the organization record. Turning on SSO sign-in for users is a separate platform configuration change your platform administrator makes after this step.";

export const SSO_WIZARD_TEST_CONNECTION_INTRO =
  "Run a sandbox sign-in test with sample claim values to verify claim-to-role mapping before saving configuration.";

export const SSO_WIZARD_CREDENTIALS_REFERENCE_LABEL = "Credentials reference (optional)";

export const SSO_WIZARD_CREDENTIALS_REFERENCE_PLACEHOLDER = "e.g. sso-signing-credentials";

export const SSO_WIZARD_DISCOVERY_ERROR = "Could not retrieve identity provider metadata. Check the URL and try again.";

export const SSO_WIZARD_TEST_LOGIN_ERROR = "Connection test did not succeed. Verify provider details and role mapping.";

export const SSO_WIZARD_ACTIVATE_ERROR = "Could not save identity provider configuration. Verify settings and try again.";

export const SSO_WIZARD_GENERIC_ERROR = "Something went wrong. Try again or contact your administrator.";

export const SSO_WIZARD_BANNED_UI_PATTERNS = [
  /TenantDatabaseBindings/i,
  /\bdbo\./i,
  /ArchLucidAuth/i,
  /startup wiring/i,
  /Identity\.SsoConfigurationActivated/i,
  /SECURITY\.md/i,
] as const;

export const SSO_WIZARD_SETTINGS_BREADCRUMB_LABEL = "Settings";

export const SSO_WIZARD_IDENTITY_PROVIDERS_BREADCRUMB_LABEL = IDENTITY_PROVIDERS_PAGE_TITLE;
