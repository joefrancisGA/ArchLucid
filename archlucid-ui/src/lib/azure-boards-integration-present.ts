import type { AzureBoardsIntegrationHealthResponse } from "@/lib/api/azure-boards-api";
import type { TenantItsmConnectorConnectionResponse } from "@/lib/api/itsm-outbound-api";

export type AzureBoardsConnectionStatus =
  | "connected"
  | "setup-incomplete"
  | "connection-issue"
  | "testing"
  | "not-available";

export type AzureBoardsConnectionStatusPresentation = {
  readonly status: AzureBoardsConnectionStatus;
  readonly label: string;
  readonly explanation: string;
  readonly nextAction: string;
};

export type AzureBoardsConnectionTestGate = {
  readonly allowed: boolean;
  readonly reason: string | null;
};

export type AzureBoardsSetupStep = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
};

const STATUS_LABELS: Record<AzureBoardsConnectionStatus, string> = {
  connected: "Connected",
  "setup-incomplete": "Setup incomplete",
  "connection-issue": "Connection issue",
  testing: "Testing",
  "not-available": "Not available",
};

export function isAzureBoardsCredentialsReady(
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
  health: AzureBoardsIntegrationHealthResponse | null | undefined,
): boolean {
  if (connection?.isConfigured === true && (connection.credentialKeyVaultSecretName?.trim().length ?? 0) > 0) {
    return true;
  }

  return health?.status !== "not_configured" && health?.reachable !== undefined;
}

export function resolveAzureBoardsConnectionStatus(input: {
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly isTesting: boolean;
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly health: AzureBoardsIntegrationHealthResponse | null | undefined;
}): AzureBoardsConnectionStatusPresentation {
  if (input.isTesting) {
    return {
      status: "testing",
      label: STATUS_LABELS.testing,
      explanation: "ArchLucid is checking connectivity to Azure DevOps.",
      nextAction: "Wait for the connection test to finish.",
    };
  }

  if (input.isLoading) {
    return {
      status: "testing",
      label: "Loading",
      explanation: "Loading Azure Boards configuration for this workspace.",
      nextAction: "Wait for configuration to load.",
    };
  }

  if (input.loadError !== null) {
    return {
      status: "not-available",
      label: STATUS_LABELS["not-available"],
      explanation: input.loadError,
      nextAction: "Reload the page or contact support if the problem continues.",
    };
  }

  if (input.nativeEnabled !== true) {
    return {
      status: "not-available",
      label: STATUS_LABELS["not-available"],
      explanation: "Outbound work item creation is not enabled for this deployment.",
      nextAction: "Ask your platform administrator to enable work management integrations.",
    };
  }

  if (!input.credentialsReady) {
    return {
      status: "setup-incomplete",
      label: STATUS_LABELS["setup-incomplete"],
      explanation: "Azure DevOps organization URL and personal access token reference are not configured yet.",
      nextAction: "Complete connection settings with a secure token reference.",
    };
  }

  if (!input.settingsReady) {
    return {
      status: "setup-incomplete",
      label: STATUS_LABELS["setup-incomplete"],
      explanation: "Default project and work item type are not saved yet.",
      nextAction: "Choose a project and work item type, then save settings.",
    };
  }

  if (input.health?.reachable === true) {
    return {
      status: "connected",
      label: STATUS_LABELS.connected,
      explanation: "ArchLucid can reach Azure DevOps with the configured credentials.",
      nextAction: "Create work items from findings or adjust default work item behavior.",
    };
  }

  if (input.health?.reachable === false) {
    return {
      status: "connection-issue",
      label: STATUS_LABELS["connection-issue"],
      explanation:
        sanitizeCustomerFacingProbeSummary(input.health.summary) ||
        "The connection check failed. Verify the organization URL, token permissions, and project access.",
      nextAction: "Run Test connection after correcting credentials or permissions.",
    };
  }

  return {
    status: "setup-incomplete",
    label: STATUS_LABELS["setup-incomplete"],
    explanation: "Connection settings are saved but have not been validated yet.",
    nextAction: "Run Test connection to confirm Azure Boards access.",
  };
}

export function resolveAzureBoardsConnectionTestGate(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly isTesting: boolean;
  readonly isSaving: boolean;
}): AzureBoardsConnectionTestGate {
  if (!input.nativeEnabled) {
    return { allowed: false, reason: "Work management integrations are not enabled for this deployment." };
  }

  if (!input.credentialsReady) {
    return { allowed: false, reason: "Complete credential setup before testing." };
  }

  if (!input.settingsReady) {
    return { allowed: false, reason: "Save a default project and work item type before testing." };
  }

  if (input.isTesting) {
    return { allowed: false, reason: null };
  }

  if (input.isSaving) {
    return { allowed: false, reason: "Wait for settings to finish saving." };
  }

  return { allowed: true, reason: null };
}

export function resolveAzureBoardsSetupSteps(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly health: AzureBoardsIntegrationHealthResponse | null | undefined;
}): readonly AzureBoardsSetupStep[] {
  return [
    {
      id: "credentials",
      label: "Organization URL and secure token reference",
      complete: input.credentialsReady,
    },
    {
      id: "defaults",
      label: "Default project and work item type",
      complete: input.settingsReady,
    },
    {
      id: "verify",
      label: "Successful connection test",
      complete: input.health?.reachable === true,
    },
    {
      id: "create",
      label: "Create work items from findings",
      complete: input.nativeEnabled && input.health?.reachable === true && input.settingsReady,
    },
  ];
}

export function sanitizeCustomerFacingProbeSummary(summary: string | null | undefined): string {
  if (summary === null || summary === undefined) {
    return "";
  }

  const trimmed = summary.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (/statuscode|_apis|json-patch|api-version/i.test(trimmed)) {
    return "Connection check failed. Verify organization access and token permissions.";
  }

  return trimmed;
}

export function formatAzureBoardsOrganizationUrl(
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
): string {
  const url = connection?.instanceBaseUrl?.trim();

  if (url && url.length > 0) {
    return url;
  }

  return "Not set";
}

export function resolveAzureBoardsCredentialStatusLabel(
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
  credentialsReady: boolean,
): string {
  if (!credentialsReady) {
    return "Not configured";
  }

  if (connection?.credentialKeyVaultSecretName?.trim()) {
    return "Secure reference saved";
  }

  return "Configured";
}
