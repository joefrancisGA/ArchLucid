/** Customer-facing copy for `/integrations/servicenow` (workspace administrator audience). */

export const SERVICENOW_INTEGRATION_PAGE_TITLE = "ServiceNow";

export const SERVICENOW_PAGE_SUBTITLE =
  "Send selected ArchLucid findings to ServiceNow as incidents and keep approval work connected to your operational workflow.";

export const SERVICENOW_INTEGRATION_PAGE_DESCRIPTION = SERVICENOW_PAGE_SUBTITLE;

export const SERVICENOW_BREADCRUMB_INTEGRATIONS_LABEL = "Integrations";

export const SERVICENOW_ACTION_REFRESH = "Refresh";

export const SERVICENOW_ACTION_REFRESHING = "Refreshing…";

export const SERVICENOW_LAST_CHECKED_PREFIX = "Last checked";

export const SERVICENOW_READINESS_LINK_LABEL = "Integration readiness";

export const SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_ADMIN =
  "Open ITSM connector administration to complete secure credential setup.";

export const SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_OPERATOR =
  "Review Integration readiness or ask an ArchLucid administrator to complete secure credential setup.";

export const SERVICENOW_INTEGRATION_READINESS_HELPER =
  "See Integration readiness for status across ServiceNow, Jira, Teams, Slack, cloud connections, and webhooks.";

export const SERVICENOW_CONNECTION_STATUS_HEADING = "Connection status";

export const SERVICENOW_CONNECTION_SETTINGS_TITLE = "Connection settings";

export const SERVICENOW_CONNECTION_SETTINGS_LEAD =
  "Review how this workspace connects to ServiceNow. Credential values are never shown after they are saved.";

export const SERVICENOW_INCIDENT_SETTINGS_TITLE = "Incident creation settings";

export const SERVICENOW_INCIDENT_SETTINGS_LEAD =
  "Control how ArchLucid links findings to ServiceNow incidents for this workspace.";

export const SERVICENOW_INCIDENT_SETTINGS_COLLAPSED_SUMMARY = "Incident creation settings";

export const SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD =
  "Available after connection is configured.";

export const SERVICENOW_CONNECTION_TEST_COLLAPSED_SUMMARY = "Test connection";

export const SERVICENOW_CMDB_AUTO_CREATE_LABEL =
  "Create a Configuration Item when no match is found";

export const SERVICENOW_CMDB_AUTO_CREATE_HELPER =
  "When ArchLucid cannot match a finding to an existing application Configuration Item (CI) in ServiceNow, it can create a new application CI in the CMDB before opening the incident. This requires create permission on application CIs in ServiceNow. Leave this off if you prefer incidents without automatic CMDB changes.";

export const SERVICENOW_CONNECTION_TEST_TITLE = "Test connection";

export const SERVICENOW_CONNECTION_TEST_LEAD =
  "Runs a read-only connection check against your ServiceNow instance.";

export const SERVICENOW_CONNECTION_TEST_BUTTON = "Test connection";

export const SERVICENOW_CONNECTION_TEST_PENDING = "Testing connection…";

export const SERVICENOW_CONNECTION_VERIFICATION_HELP_LABEL =
  "ServiceNow connection verification checklist";

export const SERVICENOW_CREDENTIALS_ADMIN_REQUIRED =
  "An ArchLucid administrator must complete the secure credential setup before this connection can be used.";

export const SERVICENOW_CREDENTIALS_SECURE_STORAGE_NOTE =
  "Credentials are stored in the configured secure secrets service and are never displayed after saving.";

export const SERVICENOW_SAVE_SETTINGS_BUTTON = "Save settings";

export const SERVICENOW_SAVE_PENDING = "Saving…";

export const SERVICENOW_RELOAD_BUTTON = "Reload";

export const SERVICENOW_OPERATOR_ADVANCED_TITLE = "Platform operator notes";

export const SERVICENOW_OPERATOR_ADVANCED_LEAD =
  "Deployment-level controls for internal operators. Workspace administrators can use connection settings above once credentials are in place.";

export const SERVICENOW_NATIVE_CREATE_LABEL = "Outbound incident creation";

export const SERVICENOW_PERMISSIONS_ASIDE_TITLE = "Required permissions";

export const SERVICENOW_PERMISSIONS_ASIDE_BODY =
  "ServiceNow needs an account that can create incidents. If you enable automatic Configuration Item creation, the account also needs permission to create application CIs in the CMDB.";

export const SERVICENOW_SETUP_PROGRESS_TITLE = "Setup progress";

export const SERVICENOW_DOCUMENTATION_ASIDE_TITLE = "Documentation and support";

export const SERVICENOW_LATEST_TEST_TITLE = "Latest connection test";

export const SERVICENOW_FIELD_INSTANCE_URL = "ServiceNow instance URL";

export const SERVICENOW_FIELD_AUTH_METHOD = "Authentication method";

export const SERVICENOW_FIELD_CREDENTIAL_STATUS = "Credential status";

export const SERVICENOW_FIELD_CONNECTION_LABEL = "Connection label";

export const SERVICENOW_CREDENTIAL_STATUS_CONFIGURED = "Configured";

export const SERVICENOW_CREDENTIAL_STATUS_NOT_CONFIGURED = "Not configured";

export const SERVICENOW_INSTANCE_URL_NOT_SET = "Not set yet";

export const SERVICENOW_AUTH_METHOD_UNKNOWN = "Not specified";

export const SERVICENOW_AUTH_BASIC = "Username and password (stored securely)";

export const SERVICENOW_AUTH_OAUTH_REFRESH = "OAuth 2.0 (refresh token)";

export const SERVICENOW_AUTH_OAUTH_CLIENT = "OAuth 2.0 (client credentials)";

export const SERVICENOW_MUTATION_DISABLED_HELPER =
  "Elevated workspace permissions are required to save incident creation settings.";

export const SERVICENOW_LOADING_MESSAGE = "Loading ServiceNow configuration…";

export const SERVICENOW_SAVE_SUCCESS = "Incident creation settings saved.";
