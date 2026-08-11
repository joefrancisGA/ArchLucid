export const SLACK_INTEGRATION_PAGE_TITLE = "Slack notifications";

export const SLACK_INTEGRATION_PAGE_SUBTITLE =
  "Send ArchLucid governance alerts to the Slack channels your teams already monitor.";

export const SLACK_INTEGRATION_HELP_SUMMARY =
  "ArchLucid sends selected governance alert events to Slack through an incoming webhook. Webhook credentials are stored with the subscription and are not displayed again after saving.";

export const SLACK_INTEGRATION_SECURITY_NOTE =
  "Webhook credentials are hidden after saving. Use a dedicated Slack incoming webhook for ArchLucid notifications.";

export const SLACK_INTEGRATION_ADD_SECTION_TITLE = "Add Slack destination";

export const SLACK_INTEGRATION_ADD_SECTION_LEAD =
  "Connect a Slack channel and choose which alert events should be sent.";

export const SLACK_INTEGRATION_DESTINATIONS_TITLE = "Slack destinations";

export const SLACK_INTEGRATION_EMPTY_TITLE = "No Slack destinations yet";

export const SLACK_INTEGRATION_EMPTY_DESCRIPTION =
  "Add a destination above to begin sending governance alerts to Slack.";

export const SLACK_INTEGRATION_SECRET_HELPER =
  "Not required for standard Slack incoming webhooks. If provided, ArchLucid stores it with the destination and does not display it again.";

export const SLACK_INTEGRATION_SECRET_STORED_WARNING =
  "For security, this value cannot be displayed again after the destination is saved.";

export const SLACK_INTEGRATION_TEST_SUCCESS = "Test notification sent successfully.";

export const SLACK_INTEGRATION_TEST_FAILURE =
  "We could not deliver the test notification. Check the webhook URL and Slack permissions.";

export const SLACK_INTEGRATION_SAVE_SUCCESS = "Slack destination saved.";

export const SLACK_INTEGRATION_DISABLE_CONFIRM =
  "Governance alerts will no longer post to this Slack channel until you enable the destination again. Saved webhook credentials and delivery history stay in this workspace.";

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
