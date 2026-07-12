export const TEAMS_INTEGRATION_PAGE_TITLE = "Microsoft Teams notifications";

export const TEAMS_INTEGRATION_PAGE_SUBTITLE =
  "Send selected ArchLucid governance and review notifications to a Microsoft Teams channel.";

export const TEAMS_INTEGRATION_SECURITY_NOTE =
  "ArchLucid uses a Key Vault reference instead of storing the Teams webhook URL directly. The webhook remains in your approved secret store and is retrieved only when a notification is sent.";

export const TEAMS_INTEGRATION_CONNECT_SECTION_TITLE = "Connect a Teams channel";

export const TEAMS_INTEGRATION_CONNECT_SECTION_LEAD =
  "Reference the Key Vault secret that contains the Teams incoming webhook URL, then choose which notifications to send.";

export const TEAMS_INTEGRATION_SECRET_HELPER =
  "Enter the name of the secret containing the Teams incoming webhook URL.";

export const TEAMS_INTEGRATION_SECRET_EXAMPLE = "Example: teams-governance-alerts-prod";

export const TEAMS_INTEGRATION_DESTINATION_NAME_HELPER =
  "Use a name that identifies the team or channel.";

export const TEAMS_INTEGRATION_SAVE_SUCCESS = "Teams connection saved.";

export const TEAMS_INTEGRATION_REMOVE_CONFIRM =
  "Remove this Microsoft Teams connection? ArchLucid will stop sending notifications to this destination. The Key Vault secret will not be deleted.";

export const TEAMS_INTEGRATION_REMOVE_SUCCESS = "Teams connection removed.";

export const TEAMS_INTEGRATION_DISABLE_CONFIRM =
  "Disable this Microsoft Teams connection? Notifications will pause until you enable the connection again.";

export const TEAMS_INTEGRATION_TEST_SUCCESS = "Test notification sent to Microsoft Teams.";

export const TEAMS_INTEGRATION_TEST_FAILURE =
  "We could not deliver the test notification. Check the webhook, Key Vault access, and Teams connector status.";

export const TEAMS_INTEGRATION_TRIGGER_REQUIRED = "Select at least one notification to send.";

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
