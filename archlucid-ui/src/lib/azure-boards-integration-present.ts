import type { AzureBoardsIntegrationHealthResponse } from "@/lib/api/azure-boards-api";
import type { TenantItsmConnectorConnectionResponse } from "@/lib/api/itsm-outbound-api";
import {
  AZURE_BOARDS_CONNECTION_PROVENANCE_NONE,
  AZURE_BOARDS_CONNECTION_PROVENANCE_UNSAVED,
  AZURE_BOARDS_CONNECTION_SAVE_DISABLED_TOKEN_HELPER,
  AZURE_BOARDS_SETUP_STEP_CURRENT_LABEL,
  AZURE_BOARDS_SETUP_STEP_DONE_LABEL,
  AZURE_BOARDS_SETUP_STEP_PENDING_LABEL,
} from "@/lib/azure-boards-page-copy";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

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
  readonly href?: string;
};

export type AzureBoardsPageCompositionBlockedReason = "feature-off" | "load-error";

export type AzureBoardsConnectionSaveGate = {
  readonly allowed: boolean;
  readonly reason: WhyDisabledCtaReason | null;
};

export type AzureBoardsPageComposition = {
  readonly blocked: boolean;
  readonly blockedReason: AzureBoardsPageCompositionBlockedReason | null;
  readonly showConnectionSettings: boolean;
  readonly defaultBehaviorCollapsed: boolean;
  readonly showConnectionTest: boolean;
  readonly connectionTestCollapsed: boolean;
  readonly saveSettingsVariant: "default" | "outline";
  readonly emphasizedSetupStepId: string;
};

const STATUS_LABELS: Record<AzureBoardsConnectionStatus, string> = {
  connected: "Connected",
  "setup-incomplete": "Setup incomplete",
  "connection-issue": "Connection issue",
  testing: "Testing",
  "not-available": "Not available",
};

/** Buyer-safe status copy when a load slice fails with an internal problem title. */
export const AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION =
  "ArchLucid could not load Azure Boards configuration for this workspace. Reload the page or contact support if the problem continues.";

const RAW_LOAD_ERROR_PATTERNS: readonly RegExp[] = [
  /database query failed/i,
  /programming error/i,
  /the database rejected the query/i,
  /\b5\d{2}\b/,
  /internal server error/i,
];

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
      explanation: sanitizeAzureBoardsLoadErrorForConnectionStatus(input.loadError),
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
      href: "#azure-boards-connection-settings",
    },
    {
      id: "defaults",
      label: "Default project and work item type",
      complete: input.settingsReady,
      href: "#azure-boards-default-behavior-heading",
    },
    {
      id: "verify",
      label: "Successful connection test",
      complete: input.health?.reachable === true,
      href: "#azure-boards-test-heading",
    },
    {
      id: "create",
      label: "Create work items from findings",
      complete: input.nativeEnabled && input.health?.reachable === true && input.settingsReady,
      href: GOVERNANCE_FINDINGS_PATH,
    },
  ];
}

export function resolveAzureBoardsSetupStepTagLabel(
  step: AzureBoardsSetupStep,
  emphasizedSetupStepId: string,
): string {
  if (step.complete) {
    return AZURE_BOARDS_SETUP_STEP_DONE_LABEL;
  }

  if (step.id === emphasizedSetupStepId) {
    return AZURE_BOARDS_SETUP_STEP_CURRENT_LABEL;
  }

  return AZURE_BOARDS_SETUP_STEP_PENDING_LABEL;
}

/** Progressive disclosure for Azure Boards integration page (TB-1154 / TB-1155). */
export function resolveAzureBoardsPageComposition(input: {
  readonly nativeEnabled: boolean;
  readonly itsmHealthLoadFailed: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly testGateAllowed: boolean;
  readonly connectionSliceFailed: boolean;
  readonly hasConnectionPayload: boolean;
}): AzureBoardsPageComposition {
  const featureBlocked = input.itsmHealthLoadFailed || !input.nativeEnabled;
  const configurationBlocked =
    featureBlocked ||
    (input.connectionSliceFailed && !input.hasConnectionPayload && !input.credentialsReady);

  if (configurationBlocked) {
    return {
      blocked: true,
      blockedReason: featureBlocked ? "feature-off" : "load-error",
      showConnectionSettings: false,
      defaultBehaviorCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: false,
      saveSettingsVariant: "outline",
      emphasizedSetupStepId: "credentials",
    };
  }

  if (!input.credentialsReady) {
    return {
      blocked: false,
      blockedReason: null,
      showConnectionSettings: true,
      defaultBehaviorCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      saveSettingsVariant: "outline",
      emphasizedSetupStepId: "credentials",
    };
  }

  if (!input.settingsReady) {
    return {
      blocked: false,
      blockedReason: null,
      showConnectionSettings: true,
      defaultBehaviorCollapsed: false,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      saveSettingsVariant: "default",
      emphasizedSetupStepId: "defaults",
    };
  }

  if (!input.testGateAllowed) {
    return {
      blocked: false,
      blockedReason: null,
      showConnectionSettings: true,
      defaultBehaviorCollapsed: false,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      saveSettingsVariant: "default",
      emphasizedSetupStepId: "verify",
    };
  }

  return {
    blocked: false,
    blockedReason: null,
    showConnectionSettings: true,
    defaultBehaviorCollapsed: false,
    showConnectionTest: true,
    connectionTestCollapsed: false,
    saveSettingsVariant: "default",
    emphasizedSetupStepId: input.testGateAllowed ? "verify" : "create",
  };
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

/**
 * Maps API problem titles / SQL mapper leaks out of Connection status.
 * Raw detail stays available to callers via loadError state / console diagnostics.
 */
export function sanitizeAzureBoardsLoadErrorForConnectionStatus(loadError: string): string {
  const trimmed = loadError.trim();

  if (trimmed.length === 0) {
    return AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION;
  }

  if (RAW_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[azure-boards] connection status load failure (raw detail not shown to buyer):", trimmed);
    }

    return AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION;
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

export function resolveAzureBoardsCredentialStatusKind(
  credentialsReady: boolean,
): "ready" | "needs-attention" | "neutral" {
  if (!credentialsReady) {
    return "needs-attention";
  }

  return "ready";
}

export function resolveAzureBoardsConnectionProvenance(
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
  hasUnsavedConnectionEdits: boolean,
): string {
  if (hasUnsavedConnectionEdits) {
    return AZURE_BOARDS_CONNECTION_PROVENANCE_UNSAVED;
  }

  const updatedUtc = connection?.updatedUtc?.trim();

  if (updatedUtc && updatedUtc.length > 0) {
    // API `*Utc` fields can arrive without a `Z`, so parse as UTC before formatting.
    const updatedMs = parseIsoUtcMs(updatedUtc);

    if (!Number.isNaN(updatedMs)) {
      return `Last modified ${formatInstantForLocale(new Date(updatedMs).toISOString())}`;
    }
  }

  return AZURE_BOARDS_CONNECTION_PROVENANCE_NONE;
}

export function hasSavedAzureBoardsCredentialReference(
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
): boolean {
  return (connection?.credentialKeyVaultSecretName?.trim().length ?? 0) > 0;
}

export function resolveAzureBoardsConnectionSaveGate(input: {
  readonly canMutate: boolean;
  readonly organizationUrl: string;
  readonly tokenReference: string;
  readonly connection: TenantItsmConnectorConnectionResponse | null | undefined;
  readonly isSaving: boolean;
}): AzureBoardsConnectionSaveGate {
  if (!input.canMutate) {
    return { allowed: false, reason: null };
  }

  if (input.isSaving) {
    return { allowed: false, reason: null };
  }

  if (input.organizationUrl.trim().length === 0) {
    return { allowed: false, reason: null };
  }

  const hasSavedCredential = hasSavedAzureBoardsCredentialReference(input.connection);
  const tokenReady = hasSavedCredential || input.tokenReference.trim().length > 0;

  if (!tokenReady) {
    return {
      allowed: false,
      reason: {
        kind: "prerequisite",
        message: AZURE_BOARDS_CONNECTION_SAVE_DISABLED_TOKEN_HELPER,
      },
    };
  }

  return { allowed: true, reason: null };
}

export function isAzureBoardsConnectionSaveSuccessful(
  saved: TenantItsmConnectorConnectionResponse,
): boolean {
  return (
    saved.isConfigured === true &&
    (saved.instanceBaseUrl?.trim().length ?? 0) > 0 &&
    hasSavedAzureBoardsCredentialReference(saved)
  );
}
