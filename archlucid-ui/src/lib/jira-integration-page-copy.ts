/** Customer-facing copy for `/integrations/jira` (workspace administrator audience). */

export const JIRA_INTEGRATION_PAGE_TITLE = "Jira";

export const JIRA_PAGE_SUBTITLE =
  "Configure Jira outbound ticket routing for this workspace — project key, severity filters, and issue-type mapping.";

export const JIRA_BREADCRUMB_INTEGRATIONS_LABEL = "Integrations";

export const JIRA_ACTION_REFRESH = "Refresh";

export const JIRA_ACTION_REFRESHING = "Refreshing…";

export const JIRA_LAST_CHECKED_PREFIX = "Last checked";

export const JIRA_READINESS_LINK_LABEL = "Integration readiness";

export const JIRA_CONNECT_WITH_ATLASSIAN_LABEL = "Connect with Atlassian";

export const JIRA_CONNECT_WITH_ATLASSIAN_PENDING = "Connecting…";

export const JIRA_CONNECTION_STATUS_HEADING = "Connection status";

export const JIRA_CONNECTION_SETTINGS_TITLE = "Connection settings";

export const JIRA_CONNECTION_SETTINGS_LEAD =
  "Review how this workspace connects to Jira Cloud. Credential values are never shown after they are saved.";

export const JIRA_WORKSPACE_ROUTING_TITLE = "Workspace routing";

export const JIRA_WORKSPACE_ROUTING_LEAD =
  "Optional per-workspace routing overrides for Jira ticket creation.";

export const JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY = "Workspace routing (available after connection)";

export const JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD =
  "Connect with Atlassian before saving workspace routing overrides.";

export const JIRA_CONNECTION_TEST_TITLE = "Test connection";

export const JIRA_CONNECTION_TEST_LEAD = "Runs a read-only connection check for Jira.";

export const JIRA_CONNECTION_TEST_BUTTON = "Test connection";

export const JIRA_CONNECTION_TEST_PENDING = "Testing connection…";

export const JIRA_CONNECTION_TEST_COLLAPSED_SUMMARY = "Test connection";

export const JIRA_CONNECTION_VERIFICATION_HELP_LABEL = "Jira connection verification checklist";

export const JIRA_CREDENTIALS_SECURE_STORAGE_NOTE =
  "Credentials are stored in the configured secure secrets service and are never displayed after saving.";

export const JIRA_SAVE_SETTINGS_BUTTON = "Save workspace settings";

export const JIRA_SAVE_PENDING = "Saving…";

export const JIRA_SAVE_SUCCESS = "Workspace routing settings saved.";

export const JIRA_RELOAD_BUTTON = "Reload";

export const JIRA_MUTATION_DISABLED_HELPER =
  "Elevated workspace permissions are required to save workspace routing settings.";

export const JIRA_SETUP_PROGRESS_TITLE = "Setup progress";

export const JIRA_PERMISSIONS_ASIDE_TITLE = "Required permissions";

export const JIRA_PERMISSIONS_ASIDE_BODY =
  "Jira needs an account that can create issues in the target project. OAuth consent grants ArchLucid offline access to create issues on your behalf.";

export const JIRA_DOCUMENTATION_ASIDE_TITLE = "Documentation and support";

export const JIRA_LATEST_TEST_TITLE = "Latest connection test";

export const JIRA_FIELD_SITE_URL = "Jira Cloud site URL";

export const JIRA_FIELD_AUTH_METHOD = "Authentication method";

export const JIRA_FIELD_CREDENTIAL_STATUS = "Credential status";

export const JIRA_FIELD_CONNECTION_LABEL = "Connection label";

export const JIRA_SITE_URL_NOT_SET = "Not set yet";

export const JIRA_AUTH_OAUTH_ATLASSIAN = "OAuth 2.0 (Atlassian)";

export const JIRA_AUTH_METHOD_UNKNOWN = "Not specified";

export const JIRA_CREDENTIAL_STATUS_CONFIGURED = "Configured";

export const JIRA_CREDENTIAL_STATUS_NOT_CONFIGURED = "Not configured";

export const JIRA_LOADING_MESSAGE = "Loading Jira configuration…";

export const JIRA_OAUTH_CONNECT_DISABLED_NO_MUTATE =
  "Elevated workspace permissions are required to start Atlassian consent.";

export const JIRA_OAUTH_CONNECT_DISABLED_NOT_READY =
  "An ArchLucid administrator must complete OAuth client references in ITSM administration before you can connect with Atlassian.";

export const JIRA_OAUTH_CONNECT_ERROR =
  "Could not start Atlassian consent. Try again or contact support if the problem continues.";
