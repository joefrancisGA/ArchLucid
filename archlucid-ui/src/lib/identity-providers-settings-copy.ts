export const IDENTITY_PROVIDERS_PAGE_TITLE = "Identity providers";

export const IDENTITY_PROVIDERS_PAGE_SUBTITLE =
  "Configure workspace sign-in, SSO, and role mapping.";

export const BUYER_IDENTITY_PROVIDERS_PAGE_SUBTITLE =
  "Sign-in, SSO, and role mapping for this workspace.";

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

export const IDENTITY_PROVIDERS_PAGE_INTRO =
  "Configure sign-in, single sign-on, and role mapping for this workspace.";

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
export const IDENTITY_PROVIDERS_SUMMARY_LAST_VALIDATION_LABEL = "Last validation";
export const IDENTITY_PROVIDERS_RECOMMENDED_NEXT_LABEL = "Recommended next step";

export const IDENTITY_PROVIDERS_STATUS_ENABLED = "Enabled";
export const IDENTITY_PROVIDERS_STATUS_DISABLED = "Disabled";
export const IDENTITY_PROVIDERS_STATUS_NOT_CONFIGURED = "Not configured";
export const IDENTITY_PROVIDERS_STATUS_ACTION_NEEDED = "Action needed";
export const IDENTITY_PROVIDERS_STATUS_NOT_APPLICABLE = "Not applicable";
export const IDENTITY_PROVIDERS_STATUS_HEALTHY = "Healthy";
export const IDENTITY_PROVIDERS_STATUS_NEEDS_REVIEW = "Needs review";

export const IDENTITY_PROVIDERS_DISCOVERY_STATUS_NOT_ATTEMPTED = "Not attempted";

export const IDENTITY_PROVIDERS_NAV_OVERVIEW = "Overview";
export const IDENTITY_PROVIDERS_NAV_SAML = "SAML";
export const IDENTITY_PROVIDERS_NAV_OIDC = "OIDC/JWT";
export const IDENTITY_PROVIDERS_NAV_ROLE_MAPPING = "Role mapping";
export const IDENTITY_PROVIDERS_NAV_DIAGNOSTICS = "Diagnostics";

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

export const IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_TITLE = "Role mapping";
export const IDENTITY_PROVIDERS_ROLE_MAPPING_PAGE_INTRO =
  "Map identity provider groups to ArchLucid workspace roles.";

export const IDENTITY_PROVIDERS_ROLE_MAPPING_HELPER =
  "Map identity provider groups to ArchLucid workspace roles.";

export const IDENTITY_PROVIDERS_ROLE_MAPPING_EXAMPLES = [
  { idpValue: "archlucid-admins", archLucidRole: "Admin" },
  { idpValue: "archlucid-operators", archLucidRole: "Operator" },
  { idpValue: "archlucid-readers", archLucidRole: "Reader" },
  { idpValue: "archlucid-auditors", archLucidRole: "Auditor" },
] as const;

export const IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_TITLE = "Identity diagnostics";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_INTRO =
  "Technical validation, health checks, and support tooling for identity configuration.";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_PAGE_SUBTITLE =
  "Validate identity configuration, review health probes, and run support tooling before enabling SSO for all users.";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_TITLE = "Technical details";
export const IDENTITY_PROVIDERS_DIAGNOSTICS_TECHNICAL_DESCRIPTION =
  "Configuration references, endpoint probes, and support diagnostics. Use only when troubleshooting with your administrator or ArchLucid support.";

export const IDENTITY_PROVIDERS_DIAGNOSTICS_INTERNAL_ONLY =
  "Advanced diagnostics are available in internal operator environments.";

export const IDENTITY_PROVIDERS_SAML_STATUS_LABEL = "SAML status";
export const IDENTITY_PROVIDERS_SAML_METADATA_URL_LABEL = "Identity provider metadata URL";
export const IDENTITY_PROVIDERS_SAML_ISSUER_LABEL = "Issuer / entity ID";
export const IDENTITY_PROVIDERS_SAML_ROLE_CLAIM_LABEL = "Attribute used for roles/groups";
export const IDENTITY_PROVIDERS_SAML_GROUP_REGEX_LABEL = "Optional custom group claim regex";

export const IDENTITY_PROVIDERS_ACTION_SAVE = "Save configuration";
export const IDENTITY_PROVIDERS_ACTION_VALIDATE = "Validate configuration";
export const IDENTITY_PROVIDERS_ACTION_FETCH_IDP_METADATA = "Fetch IdP metadata";
export const IDENTITY_PROVIDERS_ACTION_TEST_ROLE_MAPPING = "Test role mapping";

export const IDENTITY_PROVIDERS_SAVE_CONFIRM_TITLE = "Save identity configuration?";
export const IDENTITY_PROVIDERS_SAVE_CONFIRM_DESCRIPTION =
  "Saving can change how users sign in. Validate configuration and keep an administrator fallback before relying on this for production access.";

export const IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_SAML = "Configure SAML metadata";
export const IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_ROLE_MAPPING = "Validate role mapping";
export const IDENTITY_PROVIDERS_RECOMMENDED_CONFIGURE_PRODUCTION_SIGN_IN =
  "Configure production sign-in before shared workspace use";
export const IDENTITY_PROVIDERS_RECOMMENDED_VALIDATE_OIDC = "Validate OIDC discovery";
export const IDENTITY_PROVIDERS_RECOMMENDED_OPEN_DIAGNOSTICS = "Review identity diagnostics";

export const IDENTITY_PROVIDERS_AUTH_MODE_LOCAL_DEV = "Local development sign-in";
export const IDENTITY_PROVIDERS_AUTH_MODE_OIDC = "OIDC / JWT";
export const IDENTITY_PROVIDERS_AUTH_MODE_API_KEY = "API key";

export const IDENTITY_PROVIDERS_FORBIDDEN_NOTE =
  "Workspace administrator access is required to view identity provider settings.";

export const IDENTITY_PROVIDERS_LOAD_ERROR_NOTE =
  "Identity provider status could not be loaded. Try again or open diagnostics for more detail.";
