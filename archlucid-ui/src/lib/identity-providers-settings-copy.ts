export const IDENTITY_PROVIDERS_PAGE_TITLE = "Identity providers";

export const IDENTITY_PROVIDERS_PAGE_SUBTITLE =
  "Configure organization sign-in, SSO, and role mapping.";

// The tenant-scope metadata line below the subtitle already states the organization-wide blast
// radius, so repeating it here read as unedited duplication and made the buyer subtitle the longer
// of the two variants.
export const BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE =
  "Configure sign-in, SSO, and role mapping.";

export const IDENTITY_PROVIDERS_PAGE_SUBTITLE_OPERATOR = IDENTITY_PROVIDERS_PAGE_SUBTITLE;

export function identityProvidersPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE
    : IDENTITY_PROVIDERS_PAGE_SUBTITLE_OPERATOR;
}

export const IDENTITY_PROVIDERS_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const IDENTITY_PROVIDERS_ACTION_REFRESH = "Refresh" as const;

export const IDENTITY_PROVIDERS_ACTION_REFRESHING = "Refreshing…" as const;

export const IDENTITY_PROVIDERS_SCOPE_DETAILS_TRIGGER = "About identity providers" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_LABEL = "Open diagnostics" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF = "/administration/identity-providers/diagnostics" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID = "identity-providers-oidc-diagnostics" as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_HREF =
  `${IDENTITY_PROVIDERS_DIAGNOSTICS_LINK_HREF}#${IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_SECTION_ID}` as const;

export const IDENTITY_PROVIDERS_BREADCRUMB_ADMINISTRATION_LABEL = "Administration" as const;

export const IDENTITY_PROVIDERS_BREADCRUMB_HUB_HREF = "/administration/identity-providers" as const;

const IDENTITY_PROVIDERS_TENANT_SCOPE_PREFIX =
  "Tenant scope: identity provider settings apply tenant-wide, to every workspace in this organization";

/** Names the current workspace as one affected workspace rather than conflating it with the tenant. */
export function identityProvidersTenantScopeLine(currentWorkspaceLabel: string | null): string {
  if (currentWorkspaceLabel === null || currentWorkspaceLabel.length === 0) {
    return `${IDENTITY_PROVIDERS_TENANT_SCOPE_PREFIX}.`;
  }

  return `${IDENTITY_PROVIDERS_TENANT_SCOPE_PREFIX} — including ${currentWorkspaceLabel}.`;
}

export const IDENTITY_PROVIDERS_PAGE_INTRO =
  "Configure sign-in, single sign-on, and role mapping for every workspace in this organization.";

export const IDENTITY_PROVIDERS_SAFETY_NOTICE =
  "Changes to identity provider settings can affect user access. Validate configuration before relying on it for production sign-in.";

export const IDENTITY_PROVIDERS_ADMIN_FALLBACK_NOTICE =
  "Keep at least one workspace administrator account that can sign in if SSO configuration changes.";

export const IDENTITY_PROVIDERS_TEST_BEFORE_ENABLE_NOTICE =
  "Test role mapping and sign-in before enabling SSO for all users.";

export const IDENTITY_PROVIDERS_RESTRICTED_TITLE = "Identity provider settings are restricted";

export const IDENTITY_PROVIDERS_RESTRICTED_DESCRIPTION =
  "Identity provider settings are available to workspace administrators.";

export const IDENTITY_PROVIDERS_SUMMARY_AUTH_MODE_LABEL = "Authentication mode";
export const IDENTITY_PROVIDERS_SUMMARY_SSO_LABEL = "Single sign-on";
export const IDENTITY_PROVIDERS_SUMMARY_SAML_LABEL = "SAML";
export const IDENTITY_PROVIDERS_SUMMARY_OIDC_LABEL = "OIDC/JWT";
export const IDENTITY_PROVIDERS_SUMMARY_ROLE_MAPPING_LABEL = "Role mapping";
export const IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL = "Validation status";
/** @deprecated Use IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL */
export const IDENTITY_PROVIDERS_SUMMARY_LAST_VALIDATION_LABEL = IDENTITY_PROVIDERS_SUMMARY_VALIDATION_STATUS_LABEL;
export const IDENTITY_PROVIDERS_OVERVIEW_SIGN_IN_STATUS_TITLE = "Sign-in status";
export const IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL = "Recommended next step";

export const IDENTITY_PROVIDERS_STATUS_ENABLED = "Enabled";
export const IDENTITY_PROVIDERS_STATUS_DISABLED = "Disabled";
export const IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED = "Not configured";
export const IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED_YET = "Not configured yet";
export const IDENTITY_PROVIDERS_STATUS_NOT_STARTED = "Not started";
export const IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED = "Action needed";
export const IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE = "Not applicable";
export const IDENTITY_PROVIDERS_STATUS_HEALTHY = "Healthy";
export const IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW = "Needs review";
export const IDENTITY_PROVIDERS_STATUS_UNKNOWN = "Unknown";
export const IDENTITY_PROVIDERS_STATUS_SOURCE_UNAVAILABLE = "Status source unavailable";
export const IDENTITY_PROVIDERS_VALIDATION_STATUS_NOT_VALIDATED_YET = "Not validated yet";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_LOCAL_DEV_REASON =
  "Local development sign-in issues no IdP group claims.";

export const IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED = "Not attempted";

export const IDENTITY_PROVIDERS_NAV_OVERVIEW = "Overview";
export const IDENTITY_PROVIDERS_NAV_SAML = "SAML";
export const IDENTITY_PROVIDERS_NAV_OIDC = "OIDC/JWT";
export const IDENTITY_PROVIDERS_NAV_ROLE_MAPPING = "Role mapping";
export const IDENTITY_PROVIDERS_NAV_DIAGNOSTICS = "Diagnostics";

/** @deprecated Overview no longer renders a configuration-areas section; kept for callers/tests. */
export const IDENTITY_PROVIDERS_OVERVIEW_CONFIGURE_LINKS_TITLE = "Configuration areas";

export const IDENTITY_PROVIDERS_SAML_PAGE_TITLE = "SAML configuration";
export const IDENTITY_PROVIDERS_SAML_PAGE_INTRO =
  "Configure SAML single sign-on, identity provider metadata, and group-to-role mapping for this workspace.";
export const IDENTITY_PROVIDERS_SAML_PAGE_SUBTITLE =
  "Set identity provider metadata and map groups to workspace roles before enabling SAML sign-in for all users.";

export const IDENTITY_PROVIDERS_OIDC_PAGE_TITLE = "OIDC/JWT status";
export const IDENTITY_PROVIDERS_OIDC_PAGE_INTRO =
  "Review OpenID Connect authority, audience, discovery status, and role claim mapping.";
export const IDENTITY_PROVIDERS_OIDC_PAGE_SUBTITLE =
  "Review OpenID Connect authority, audience, discovery status, and role claim mapping before enabling SSO for all users.";
export const IDENTITY_PROVIDERS_OIDC_LOADING = "Loading OIDC/JWT status…";
export const IDENTITY_PROVIDERS_OIDC_EMPTY =
  "OIDC/JWT discovery has not been run yet for this workspace.";
export const IDENTITY_PROVIDERS_OIDC_ACTION_VALIDATE_DISCOVERY = "Validate discovery";

export const IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE = "Role mapping status";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO =
  "Review identity source, claim mapping, and workspace role assignment status for this workspace.";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE =
  "Review identity source, claim mapping, and workspace role assignment before enabling SSO for all users.";

export const BUYER_IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE =
  "Review identity source and group-to-role mapping before enabling SSO for all users." as const;

export function identityProvidersRoleMappingPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? BUYER_IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE
    : IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_SUBTITLE;
}

export const IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER =
  "Map identity provider groups to ArchLucid workspace roles.";

export const IDENTITY_PROVIDERS_ROLE_MAPPING_SEMANTICS_HELPER =
  "Unmapped IdP groups or role values receive no ArchLucid role. A user can match multiple mappings and receive every matching role. Each IdP value maps to one ArchLucid role — the same value cannot be used in two rows.";

export const IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES = [
  { idpValue: "archlucid-admins", archLucidRole: "Admin" },
  { idpValue: "archlucid-operators", archLucidRole: "Operator" },
  { idpValue: "archlucid-readers", archLucidRole: "Reader" },
  { idpValue: "archlucid-auditors", archLucidRole: "Auditor" },
] as const;
export const IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_LABEL = "Illustrative mapping examples";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES_HELPER =
  "Sample IdP group names for reference — not your tenant's live configuration.";

export const IDENTITY_PROVIDERS_ROLE_MAPPING_LOADING = "Loading role mapping status…";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_LOAD_ERROR =
  "Could not load configured role mappings for this tenant. Refresh or try again in a moment.";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_EMPTY_STATE =
  "No group or claim mappings are saved for this organization yet.";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_TABLE_TITLE = "Configured mappings";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_EDIT_SAML = "Edit SAML role mapping";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_OPEN_SSO_WIZARD = "Open SSO wizard";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_ACTION_TEST_TOKEN = "Test a token against this mapping";
export const IDENTITY_PROVIDERS_ACTION_OPEN_IDENTITY_DIAGNOSTICS = "Open identity diagnostics";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE = "Identity diagnostics";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_INTRO =
  "Technical validation, health checks, and support tooling for identity configuration.";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE =
  "Validate identity configuration, review health probes, and run support tooling before enabling SSO for all users.";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING = "Loading identity diagnostics…";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_PROTOCOL_DETAILS_TITLE = "Protocol diagnostics";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_OIDC_DETAILS_TITLE = "OIDC discovery details";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_SAML_DETAILS_TITLE = "SAML operational details";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE = "Technical details";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_DESCRIPTION =
  "Configuration references, endpoint probes, and support diagnostics. Use only when troubleshooting with your administrator or ArchLucid support.";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_INTERNAL_ONLY =
  "Advanced diagnostics are available in internal operator environments.";

export const IDENTITY_PROVIDERS_SAML_STATUS_LABEL = "SAML status";
export const IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL = "Identity provider metadata URL (lookup only)";
export const IDENTITY_PROVIDERS_SAML_METADATA_URL_HELPER =
  "Use this URL once to fetch issuer and claim names. It is not saved with your configuration.";
export const IDENTITY_PROVIDERS_SAML_ISSUER_LABEL = "Identity provider issuer (IdP entity ID)";
export const IDENTITY_PROVIDERS_SAML_ISSUER_VALIDATION_REQUIRED = "Identity provider issuer (IdP entity ID) is required.";

export const IDENTITY_PROVIDERS_SAML_SP_VALUES_CARD_TITLE = "ArchLucid service provider values";
export const IDENTITY_PROVIDERS_SAML_SP_VALUES_CARD_INTRO =
  "Register these values in your identity provider before users can sign in with SAML.";
export const IDENTITY_PROVIDERS_SAML_SP_ACS_LABEL = "Assertion Consumer Service (ACS) / Reply URL path";
export const IDENTITY_PROVIDERS_SAML_SP_ACS_HOST_NOTE =
  "Append this path to your ArchLucid API host. That is not this console's address when the API is deployed on a separate host, so confirm the API host before registering the reply URL.";
export const IDENTITY_PROVIDERS_SAML_SP_ENTITY_ID_LABEL = "ArchLucid entity ID (SP)";
export const IDENTITY_PROVIDERS_SAML_SP_METADATA_UNAVAILABLE =
  "Ask your platform administrator for the ArchLucid SP entity ID and metadata XML.";

export const IDENTITY_PROVIDERS_SAML_SAVE_EFFECT_LINE =
  "Save configuration writes your IdP issuer and group-to-role mapping to the identity provider record for every workspace in this organization. It does not change how anyone signs in today — turning on SAML sign-in is a separate platform configuration change. The";
export const IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_LABEL = "SSO setup wizard";
export const IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_LINK_HREF = "/administration/identity/sso-wizard" as const;
export const IDENTITY_PROVIDERS_SAML_SAVE_ENABLEMENT_SUFFIX =
  " walks through the same settings with a sandbox sign-in test.";

export const IDENTITY_PROVIDERS_SAML_MAPPING_ADD_ROW = "Add mapping";
export const IDENTITY_PROVIDERS_SAML_MAPPING_REMOVE_ROW = "Remove";

export const IDENTITY_PROVIDERS_SAML_MAPPING_VALIDATION_REQUIRED =
  "Add at least one IdP group or role mapping.";

export const IDENTITY_PROVIDERS_SAML_TEST_MAPPING_CARD_TITLE = "Test role mapping";
export const IDENTITY_PROVIDERS_SAML_TEST_MAPPING_CARD_DESCRIPTION =
  "Evaluate a sample identity token against the saved SAML configuration for this organization. Unsaved edits on this form are not included.";
export const IDENTITY_PROVIDERS_SAML_TEST_MAPPING_UNSAVED_NOTICE =
  "You have unsaved configuration edits — the test below uses the last saved mapping, not the values currently in the form.";

export const IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_EXPLANATION =
  "SAML sign-in is not enabled for this organization, so settings saved here are stored but not yet used to sign anyone in. Turning it on is a platform configuration change your platform administrator makes outside this screen. To configure and test the connection in the meantime, use the";
export const IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_NEXT_STEP_HREF =
  "/administration/identity/sso-wizard" as const;
export const IDENTITY_PROVIDERS_SAML_STATUS_DISABLED_NEXT_STEP_LABEL = "SSO setup wizard";
export const IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL = "Attribute used for roles/groups";
export const IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL = "Optional custom group claim regex";

export const IDENTITY_PROVIDERS_SAML_ADVANCED_SETTINGS_TITLE = "Advanced settings";

export const IDENTITY_PROVIDERS_ACTION_SAVE = "Save configuration";
export const IDENTITY_PROVIDERS_ACTION_VALIDATE = "Validate configuration";
export const IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA = "Fetch IdP metadata";
export const IDENTITY_PROVIDERS_ACTION_TEST_ROLE_MAPPING = "Test role mapping";

export const IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE = "Save identity configuration?";
export const IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION =
  "This saves your IdP issuer and group-to-role mapping to the identity provider record for every workspace in this organization. It does not change how anyone signs in today — turning on SAML sign-in is a separate platform configuration change. Keep at least one administrator who can sign in without SAML before relying on this for production access.";

export const IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML = "Configure SAML metadata";
export const IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING = "Validate role mapping";
export const IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN = "Open SSO setup wizard";

export const IDENTITY_PROVIDERS_SSO_SETUP_CTA_LABEL = "Configure SSO";

export const IDENTITY_PROVIDERS_SSO_SETUP_CTA_HREF = "/administration/identity/sso-wizard" as const;
export const IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN_DETAIL =
  "Saving configuration writes your IdP settings to the identity provider record. It does not change how anyone signs in today — turning on SSO sign-in is a separate platform configuration change. Local development sign-in is not suitable for shared use, so complete this before inviting other users.";
export const IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_OIDC = "Validate OIDC discovery";
export const IDENTITY_PROVIDERS_RECOMMENDED_OPEN_DIAGNOSTICS = "Review identity diagnostics";

export const IDENTITY_PROVIDERS_AUTH_MODE_LOCAL_DEV = "Local development sign-in";
export const IDENTITY_PROVIDERS_AUTH_MODE_OIDC = "OIDC / JWT";
export const IDENTITY_PROVIDERS_AUTH_MODE_API_KEY = "API key";

export const IDENTITY_PROVIDERS_FORBIDDEN_NOTE =
  "Workspace administrator access is required to view identity provider settings.";

export const IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE =
  "Identity provider status could not be loaded. Try again or open diagnostics for more detail.";
export const IDENTITY_PROVIDERS_CONFIG_SUMMARY_LOAD_ERROR_NOTE =
  "Configuration key catalog could not be loaded. Try again or open diagnostics for more detail.";
/** @deprecated Use IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE or IDENTITY_PROVIDERS_CONFIG_SUMMARY_LOAD_ERROR_NOTE */
export const IDENTITY_PROVIDERS_LOAD_ERROR_NOTE = IDENTITY_PROVIDERS_STATUS_LOAD_ERROR_NOTE;
export const IDENTITY_PROVIDERS_OVERVIEW_STATUS_FAILURE_TITLE = "Identity provider status unavailable";
export const IDENTITY_PROVIDERS_OVERVIEW_RELATED_SURFACES_TITLE = "Related identity surfaces";
