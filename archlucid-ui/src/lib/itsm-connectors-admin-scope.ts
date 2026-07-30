/** System-admin-only Jira and ServiceNow connector surface (not on buyer Integrations nav). */
export const ITSM_CONNECTORS_ADMIN_PATH = "/admin/integrations/itsm";

export const ITSM_CONNECTORS_ADMIN_LABEL = "ITSM connectors";

export const ITSM_CONNECTORS_ADMIN_SUMMARY =
  "Configure Jira and ServiceNow outbound create and inbound status sync for employee connector onboarding. Buyer Integrations stays export-first — use this page for deployment credentials and tenant routing overrides.";

export const ITSM_CONNECTORS_PAGE_CONFIG_CARD_TITLE = "What this page configures";

export const ITSM_CONNECTORS_NATIVE_ENABLED_MESSAGE =
  "Native outbound create is enabled for this deployment.";

export const ITSM_CONNECTORS_NATIVE_DISABLED_MESSAGE =
  "Native outbound create is disabled for this deployment (clipboard export still available). Ask a platform administrator to enable one-click Jira/ServiceNow create after smoke validation.";

export const ITSM_CONNECTORS_WIZARD_PREREQUISITES_DESCRIPTION =
  "Outbound credentials are configured by your platform team — this wizard only saves per-tenant routing overrides.";

export const ITSM_CONNECTORS_WIZARD_NATIVE_DISABLED_MESSAGE =
  "Native outbound create is disabled for this deployment. Ask a platform administrator to enable one-click Jira/ServiceNow create after smoke validation. Clipboard export and correlations remain enabled.";

export const ITSM_CONNECTORS_JIRA_CREDENTIALS_NOT_CONFIGURED =
  "not configured — ask a platform administrator to add Jira credentials";

export const ITSM_CONNECTORS_SERVICENOW_CREDENTIALS_NOT_CONFIGURED =
  "not configured — ask a platform administrator to add ServiceNow credentials";

/** Regression guard — appsettings keys and V1-window chrome must not render on admin ITSM surfaces (TB-1430). */
export const ITSM_CONNECTORS_ADMIN_BANNED_SUBSTRINGS: readonly string[] = [
  "Integrations:Itsm",
  "V1 scope",
  "System Administration",
  "internal V1 rollout",
] as const;

/** In-app help entry points for connector smoke validation (operator runbooks). */
export const ITSM_CONNECTOR_SMOKE_HELP = {
  jira: "/help/troubleshooting",
  serviceNow: "/help/troubleshooting",
  scaffold: "/help/troubleshooting",
} as const;
