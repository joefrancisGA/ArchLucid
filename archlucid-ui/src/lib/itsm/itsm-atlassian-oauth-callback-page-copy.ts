/** Operator-facing copy for `/integrations/itsm/oauth/callback` (TB-1782, TB-1783). */

/** @deprecated Prefer outcome-specific titles — loading uses {@link ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE}. */
export const ITSM_ATLASSIAN_OAUTH_CALLBACK_PAGE_TITLE = "Atlassian connector consent";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_TITLE = "Completing Atlassian consent";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_TITLE = "Jira connected";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_FAILURE_TITLE = "Consent failed";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_DETAIL = "Completing Atlassian consent…";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_LOADING_STATUS_LABEL = "Completing consent";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_SUCCESS_MESSAGE =
  "Jira is connected with OAuth. Open Jira integration settings to review connector health and configuration.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_OPEN_JIRA_LABEL = "Open Jira";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_UNCHANGED =
  "The Jira connector is unchanged — this consent attempt did not store new credentials.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_CONNECTOR_STATE_CONSENT_WITHOUT_CREDENTIAL =
  "Atlassian accepted consent, but ArchLucid did not retain a refresh credential. The Jira connector is not connected until storage succeeds.";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_SUPPORT_DISCLOSURE_SUMMARY = "Details for support";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_CONTACT_SUPPORT_LABEL = "Contact support";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_BREADCRUMB_INTEGRATIONS_LABEL = "Integrations";

export const ITSM_ATLASSIAN_OAUTH_CALLBACK_BREADCRUMB_JIRA_LABEL = "Jira";
