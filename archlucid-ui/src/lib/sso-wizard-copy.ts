import { IDENTITY_PROVIDERS_PAGE_TITLE } from "@/lib/identity-providers-settings-copy";

export const SSO_WIZARD_PAGE_TITLE = "Configure single sign-on";

export const SSO_WIZARD_PAGE_INTRO =
  "Connect ArchLucid to your organization's identity provider. You will test the connection before it can be activated for users.";

export const SSO_WIZARD_STATUS_NOT_ACTIVE =
  "Changes are not active until the final step.";

export const SSO_WIZARD_BACK_LINK_LABEL = "Back to identity providers";

export const SSO_WIZARD_IDENTITY_PROVIDERS_HREF = "/administration/identity-providers";

export const SSO_WIZARD_SETTINGS_HREF = "/administration";

export const SSO_WIZARD_BREADCRUMB_CONFIGURE = "Configure SSO";

export const SSO_WIZARD_IDP_STEP_HEADING = "Choose your identity provider";

export const SSO_WIZARD_IDP_STEP_INSTRUCTION =
  "Select the directory or SSO product your organization uses. We will suggest a protocol next.";

export const SSO_WIZARD_IDP_REQUIRED_HELPER = "Select an identity provider to continue.";

export const SSO_WIZARD_PROTOCOL_STEP_HEADING = "Choose a protocol";

export const SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION =
  "Select the protocol supported by your identity provider.";

export const SSO_WIZARD_PROTOCOL_REQUIRED_HELPER =
  "Select OpenID Connect or SAML 2.0 to continue.";

export const SSO_WIZARD_PROTOCOL_HELP_SUMMARY = "Not sure which protocol to choose?";

export const SSO_WIZARD_PROTOCOL_HELP_BODY =
  "Choose OpenID Connect when your provider supports it and you are setting up a new integration. Choose SAML 2.0 when required by your identity provider or an existing enterprise federation standard.";

export const SSO_WIZARD_TRUST_REASSURANCE =
  "Your current sign-in configuration will remain unchanged until you test and activate this connection.";

export const SSO_WIZARD_CANCEL_LABEL = "Cancel";

export const SSO_WIZARD_CONTINUE_LABEL = "Continue";

export const SSO_WIZARD_BACK_STEP_LABEL = "Back";

export const SSO_WIZARD_ACTIVATE_LABEL = "Activate SSO";

export const SSO_WIZARD_ACTIVATING_LABEL = "Activating…";

export const SSO_WIZARD_CANCEL_UNSAVED_CONFIRM =
  "Discard your in-progress SSO configuration and return to identity providers?";

export const SSO_WIZARD_ACTIVATE_INTRO =
  "Review your settings, then activate single sign-on for this workspace. Activation applies only after a successful connection test.";

export const SSO_WIZARD_CREDENTIALS_REFERENCE_LABEL = "Credentials reference (optional)";

export const SSO_WIZARD_CREDENTIALS_REFERENCE_PLACEHOLDER = "e.g. sso-signing-credentials";

export const SSO_WIZARD_DISCOVERY_ERROR = "Could not retrieve identity provider metadata. Check the URL and try again.";

export const SSO_WIZARD_TEST_LOGIN_ERROR = "Connection test did not succeed. Verify provider details and role mapping.";

export const SSO_WIZARD_ACTIVATE_ERROR = "Could not activate single sign-on. Verify configuration and try again.";

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
