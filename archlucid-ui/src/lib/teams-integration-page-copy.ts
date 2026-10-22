export const TEAMS_INTEGRATION_PAGE_TITLE = "Microsoft Teams notifications";

export const TEAMS_INTEGRATION_PAGE_SUBTITLE =
  "Send selected ArchLucid policy and review notifications to a Microsoft Teams channel.";

export const TEAMS_INTEGRATION_SECURITY_NOTE =
  "ArchLucid stores a secret reference instead of the Teams webhook URL in the workspace database. The webhook remains in your organization's approved secret store and is read only when a notification is sent.";

export const TEAMS_INTEGRATION_CONNECT_SECTION_TITLE = "Connect a Teams channel";

/** Shown when no saved connection exists so draft/defaults are not mistaken for active config (TB-1175). */
export const TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER =
  "Draft — not saved. Example placeholders and recommended notifications are suggestions until you save a connection.";

export const TEAMS_INTEGRATION_CONNECT_SECTION_LEAD =
  "Reference the secret that contains your Teams incoming webhook URL, then choose which notifications to send.";

export const TEAMS_INTEGRATION_HELP_SUMMARY =
  "Microsoft Teams notifications route selected policy and review events to a channel your operators already monitor. Use this guide before configuring secret references, triggers, and test delivery.";

/** Shared setup sequence for `/integrations/teams` and `/help/teams-integration`. */
export const TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS = [
  "Create an incoming webhook for the Teams channel that should receive notifications.",
  "Store the webhook URL in your organization's approved secret store.",
  "Confirm that the ArchLucid delivery identity can read that secret.",
  "Enter the secret name or reference on the Teams notifications page.",
  "Validate the secret, then send a test notification before saving.",
] as const;

export const TEAMS_SETUP_STEP_CREATE_WEBHOOK = TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS[0];

export const TEAMS_SETUP_STEP_ENTER_SECRET = TEAMS_INTEGRATION_BEFORE_YOU_CONNECT_STEPS[3];

export const TEAMS_SETUP_STEP_SEND_TEST =
  "Select notification triggers and send a test notification.";

export const TEAMS_SETUP_STEP_SAVE_CONNECTION =
  "Save the connection once validation and test delivery succeed.";

export const TEAMS_INTEGRATION_SECRET_NAME_LABEL = "Secret name";

export const TEAMS_INTEGRATION_SECRET_HELPER =
  "Enter the secret name or reference that contains the Teams incoming webhook URL.";

export const TEAMS_INTEGRATION_SECRET_EXAMPLE = "Example: teams-governance-alerts-prod";

export const TEAMS_INTEGRATION_DESTINATION_NAME_HELPER =
  "Use a name that identifies the team or channel.";

export const TEAMS_INTEGRATION_SAVE_SUCCESS = "Teams connection saved.";

export const TEAMS_INTEGRATION_REMOVE_CONFIRM =
  "Remove this Microsoft Teams connection? ArchLucid will stop sending notifications to this destination. The secret in your approved secret store will not be deleted.";

export const TEAMS_INTEGRATION_REMOVE_SUCCESS = "Teams connection removed.";

export const TEAMS_INTEGRATION_DISABLE_CONFIRM =
  "Disable this Microsoft Teams connection? Notifications will pause until you enable the connection again.";

export const TEAMS_INTEGRATION_TEST_SUCCESS = "Test notification sent to Microsoft Teams.";

export const TEAMS_INTEGRATION_TEST_FAILURE =
  "We could not deliver the test notification. Check the webhook, secret-store access, and Teams connector status.";

export const TEAMS_INTEGRATION_TRIGGER_REQUIRED = "Select at least one notification to send.";

export const TEAMS_INTEGRATION_DEMO_CAPABILITY_DESCRIPTION =
  "In a connected tenant, administrators can connect Microsoft Teams notifications using a secret reference from your approved secret store.";

export const TEAMS_INTEGRATION_SECRET_NAME_REQUIRED_MESSAGE = "Enter a secret name or reference.";

export const TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE =
  "Enter a secret name or reference, not a webhook URL.";

export const TEAMS_INTEGRATION_SECRET_ACCESS_FAILURE_MESSAGE =
  "ArchLucid could not read the configured secret. Confirm the secret exists and that this deployment can access your organization's secret store.";

export type TeamsIntegrationConnectionStatus = "not-configured" | "connected" | "disabled" | "connection-issue";

export function resolveTeamsIntegrationConnectionStatus(input: {
  readonly isConfigured: boolean;
  readonly enabledTriggerCount: number;
  readonly hasConnectionIssue: boolean;
}): TeamsIntegrationConnectionStatus {
  if (input.hasConnectionIssue && input.isConfigured) {
    return "connection-issue";
  }

  if (!input.isConfigured) {
    return "not-configured";
  }

  if (input.enabledTriggerCount === 0) {
    return "disabled";
  }

  return "connected";
}

export function teamsIntegrationConnectionStatusLabel(status: TeamsIntegrationConnectionStatus): string {
  switch (status) {
    case "not-configured":
      return "Not configured";

    case "connected":
      return "Connected";

    case "disabled":
      return "Disabled";

    case "connection-issue":
      return "Connection issue";

    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export const TEAMS_INTEGRATION_NOT_CONFIGURED_NEXT_STEP =
  "Enter your Teams webhook secret reference, validate access, test delivery, then save the connection.";

/** Shown when Send test notification stays disabled until Validate succeeds (TB-1176). */
export const TEAMS_INTEGRATION_TEST_DISABLED_HELPER =
  "Validate the secret before sending a test.";

/** Shown when Save stays disabled until Validate succeeds on a new connection. */
export const TEAMS_INTEGRATION_SAVE_DISABLED_HELPER =
  "Validate the secret before saving.";

export function teamsIntegrationConnectionStatusTagKind(
  status: TeamsIntegrationConnectionStatus,
): "ready" | "needs-attention" {
  if (status === "connected") {
    return "ready";
  }

  return "needs-attention";
}
