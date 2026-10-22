export const SLACK_INTEGRATION_PAGE_TITLE = "Slack notifications";

export const SLACK_INTEGRATION_PAGE_SUBTITLE =
  "Send ArchLucid alerts to the Slack channels your teams already monitor.";

export const SLACK_BREADCRUMB_INTEGRATIONS_LABEL = "Integrations";

export const SLACK_ACTION_REFRESH = "Refresh";

export const SLACK_ACTION_REFRESHING = "Refreshing…";

export const SLACK_LAST_CHECKED_PREFIX = "Last checked";

export const SLACK_READINESS_LINK_LABEL = "Integration readiness";

export const SLACK_DESTINATIONS_REFRESH_LABEL = "Refresh";

export const SLACK_DESTINATIONS_REFRESHING_LABEL = "Refreshing…";

export const SLACK_SETUP_PROGRESS_TITLE = "Setup progress";

export const SLACK_CONFIGURATION_STATUS_ASIDE_TITLE = "Configuration status";

export const SLACK_SECURITY_ASIDE_TITLE = "Security";

export const SLACK_SETUP_STEP_CREATE_WEBHOOK = "Create a Slack incoming webhook";

export const SLACK_SETUP_STEP_ADD_DESTINATION = "Add destination details and webhook URL";

export const SLACK_SETUP_STEP_SEND_TEST = "Send a successful test notification";

export const SLACK_SETUP_STEP_SAVE_DESTINATION = "Save destination and enable alerts";

export const SLACK_FIELD_DESTINATION_NAME_LABEL = "Destination name";

export const SLACK_FIELD_WEBHOOK_URL_LABEL = "Slack incoming webhook URL";

export const SLACK_INTEGRATION_HELP_SUMMARY =
  "ArchLucid sends selected alert events to Slack through an incoming webhook. Webhook credentials are stored with the subscription and are not displayed again after saving.";

export const SLACK_INTEGRATION_SECURITY_NOTE =
  "Webhook credentials are hidden after saving. Use a dedicated Slack incoming webhook for ArchLucid notifications.";

export const SLACK_INTEGRATION_ADD_SECTION_TITLE = "Add Slack destination";

export const SLACK_INTEGRATION_ADD_SECTION_LEAD =
  "Connect a Slack channel and choose which alert events should be sent.";

export const SLACK_INTEGRATION_DESTINATIONS_TITLE = "Slack destinations";

export const SLACK_INTEGRATION_EMPTY_TITLE = "No Slack destinations yet";

export const SLACK_INTEGRATION_EMPTY_DESCRIPTION =
  "Add a destination above to begin sending alerts to Slack.";

export const SLACK_INTEGRATION_SECRET_HELPER =
  "Not required for standard Slack incoming webhooks. If provided, ArchLucid stores it with the destination and does not display it again after saving.";

export const SLACK_INTEGRATION_TEST_SUCCESS = "Test notification sent successfully.";

export const SLACK_INTEGRATION_TEST_FAILURE =
  "We could not deliver the test notification. Check the webhook URL and Slack permissions.";

export const SLACK_INTEGRATION_SAVE_SUCCESS = "Slack destination saved.";

export const SLACK_INTEGRATION_DISABLE_CONFIRM =
  "Alerts will no longer post to this Slack channel until you enable the destination again. Saved webhook credentials and delivery history stay in this workspace.";

export const SLACK_INTEGRATION_DISABLE_SUCCESS = "Slack destination disabled.";

export const SLACK_INTEGRATION_ENABLE_SUCCESS = "Slack destination enabled.";

export const SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP =
  "Create a Slack incoming webhook, paste the URL below, send a test, then save the destination.";

export const SLACK_INTEGRATION_SAVE_DISABLED_HELPER =
  "Send a successful test notification before saving this destination.";

export function slackIntegrationConfigurationStatusLabel(activeDestinationCount: number): string {
  if (activeDestinationCount === 0) {
    return "Not configured";
  }

  if (activeDestinationCount === 1) {
    return "1 active destination";
  }

  return `${activeDestinationCount} active destinations`;
}

export function slackIntegrationConfigurationStatusTagKind(
  activeDestinationCount: number,
): "ready" | "needs-attention" {
  if (activeDestinationCount > 0) {
    return "ready";
  }

  return "needs-attention";
}

export function slackIntegrationDestinationsSupportingText(totalCount: number): string {
  if (totalCount === 0) {
    return "No destinations in this workspace yet.";
  }

  if (totalCount === 1) {
    return "1 destination in this workspace.";
  }

  return `${totalCount} destinations in this workspace.`;
}
