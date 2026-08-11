import type {
  ItsmIntegrationHealthResponse,
  TenantItsmConnectorConnectionResponse,
  TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

import {
  SERVICENOW_AUTH_BASIC,
  SERVICENOW_AUTH_METHOD_UNKNOWN,
  SERVICENOW_AUTH_OAUTH_CLIENT,
  SERVICENOW_AUTH_OAUTH_REFRESH,
} from "./servicenow-integration-page-copy";

export type ServiceNowConnectionStatus =
  | "connected"
  | "setup-incomplete"
  | "connection-issue"
  | "testing"
  | "not-available";

export type ServiceNowConnectionStatusPresentation = {
  readonly status: ServiceNowConnectionStatus;
  readonly label: string;
  readonly explanation: string;
  readonly nextAction: string;
};

export type ServiceNowConnectionTestGate = {
  readonly allowed: boolean;
  readonly reason: string | null;
};

export type ServiceNowSetupStep = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
};

export type ServiceNowPageComposition = {
  readonly showNotConfiguredNextStep: boolean;
  readonly incidentSettingsCollapsed: boolean;
  readonly showConnectionTest: boolean;
  readonly connectionTestCollapsed: boolean;
  readonly emphasizedSetupStepId: string;
};

const STATUS_LABELS: Record<ServiceNowConnectionStatus, string> = {
  connected: "Connected",
  "setup-incomplete": "Setup incomplete",
  "connection-issue": "Connection issue",
  testing: "Testing",
  "not-available": "Not available",
};

/** Buyer-safe status copy when a load slice fails with an internal problem title. */
export const SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION =
  "ArchLucid could not load ServiceNow configuration for this workspace. Reload the page or contact support if the problem continues.";

const RAW_LOAD_ERROR_PATTERNS: readonly RegExp[] = [
  /database query failed/i,
  /programming error/i,
  /the database rejected the query/i,
  /\b5\d{2}\b/,
  /internal server error/i,
];

export function isServiceNowCredentialsReady(
  settings: TenantItsmOutboundSettingsResponse | null | undefined,
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
  probe: ItsmIntegrationHealthResponse["serviceNow"] | null | undefined,
): boolean {
  if (settings?.deploymentCredentials?.serviceNowConfigured === true) {
    return true;
  }

  if (connection?.isConfigured === true) {
    return true;
  }

  return probe?.locallyConfigured === true;
}

export function resolveServiceNowConnectionStatus(input: {
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly isTesting: boolean;
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly probe: ItsmIntegrationHealthResponse["serviceNow"] | null | undefined;
}): ServiceNowConnectionStatusPresentation {
  if (input.isTesting) {
    return {
      status: "testing",
      label: STATUS_LABELS.testing,
      explanation: "ArchLucid is checking connectivity to ServiceNow.",
      nextAction: "Wait for the connection test to finish.",
    };
  }

  if (input.isLoading) {
    return {
      status: "testing",
      label: "Loading",
      explanation: "Loading ServiceNow configuration for this workspace.",
      nextAction: "Wait for configuration to load.",
    };
  }

  if (input.loadError !== null) {
    return {
      status: "not-available",
      label: STATUS_LABELS["not-available"],
      explanation: sanitizeServiceNowLoadErrorForConnectionStatus(input.loadError),
      nextAction: "Reload the page or contact support if the problem continues.",
    };
  }

  if (input.nativeEnabled !== true) {
    return {
      status: "not-available",
      label: STATUS_LABELS["not-available"],
      explanation: "Outbound ServiceNow incident creation is not enabled for this deployment.",
      nextAction: "Ask your platform administrator to enable ServiceNow outbound integration.",
    };
  }

  if (!input.credentialsReady) {
    return {
      status: "setup-incomplete",
      label: STATUS_LABELS["setup-incomplete"],
      explanation: "ServiceNow credentials and instance details are not configured yet.",
      nextAction: "Ask an ArchLucid administrator to complete secure credential setup.",
    };
  }

  if (input.probe?.reachable === true) {
    return {
      status: "connected",
      label: STATUS_LABELS.connected,
      explanation: "ArchLucid can reach ServiceNow with the configured credentials.",
      nextAction: "You can create incidents from findings or run another connection test.",
    };
  }

  if (input.probe?.reachable === false) {
    const detail = sanitizeCustomerFacingProbeSummary(input.probe.summary);

    return {
      status: "connection-issue",
      label: STATUS_LABELS["connection-issue"],
      explanation:
        detail.length > 0
          ? detail
          : "ArchLucid could not reach ServiceNow with the current credentials.",
      nextAction: "Verify the instance URL and credentials, then test the connection again.",
    };
  }

  return {
    status: "setup-incomplete",
    label: STATUS_LABELS["setup-incomplete"],
    explanation: "Credentials are recorded but a successful connection check has not completed yet.",
    nextAction: "Run a connection test after setup is complete.",
  };
}

export function resolveServiceNowConnectionTestGate(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly isTesting: boolean;
  readonly isSaving: boolean;
}): ServiceNowConnectionTestGate {
  if (input.isTesting) {
    return { allowed: false, reason: "A connection test is already running." };
  }

  if (input.isSaving) {
    return { allowed: false, reason: "Wait until settings finish saving." };
  }

  if (input.nativeEnabled !== true) {
    return {
      allowed: false,
      reason: "Outbound ServiceNow incident creation is not enabled for this deployment.",
    };
  }

  if (!input.credentialsReady) {
    return {
      allowed: false,
      reason: "Complete credential setup before testing the connection.",
    };
  }

  return { allowed: true, reason: null };
}

export function formatServiceNowAuthMethod(authMode: string | null | undefined): string {
  const normalized = authMode?.trim();

  if (normalized === "BasicApiToken") {
    return SERVICENOW_AUTH_BASIC;
  }

  if (normalized === "OAuth2RefreshToken") {
    return SERVICENOW_AUTH_OAUTH_REFRESH;
  }

  if (normalized === "OAuth2ClientCredentials") {
    return SERVICENOW_AUTH_OAUTH_CLIENT;
  }

  return SERVICENOW_AUTH_METHOD_UNKNOWN;
}

export function resolveServiceNowCredentialStatusLabel(
  settings: TenantItsmOutboundSettingsResponse | null | undefined,
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
  credentialsReady: boolean,
): string {
  if (!credentialsReady) {
    return "Not configured";
  }

  const maskedUsername = settings?.deploymentCredentials?.serviceNowUsernameMasked?.trim();

  if (maskedUsername && maskedUsername.length > 0) {
    return `Configured (${maskedUsername})`;
  }

  if (connection?.authUserName && connection.authUserName.trim().length > 0) {
    return `Configured (${connection.authUserName.trim()})`;
  }

  return "Configured";
}

/** Progressive disclosure for ServiceNow integration page (TB-1164 / TB-1165). */
export function resolveServiceNowPageComposition(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly testGateAllowed: boolean;
}): ServiceNowPageComposition {
  if (!input.nativeEnabled) {
    return {
      showNotConfiguredNextStep: !input.credentialsReady,
      incidentSettingsCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: false,
      emphasizedSetupStepId: "native",
    };
  }

  if (!input.credentialsReady) {
    return {
      showNotConfiguredNextStep: true,
      incidentSettingsCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: false,
      emphasizedSetupStepId: "credentials",
    };
  }

  if (!input.testGateAllowed) {
    return {
      showNotConfiguredNextStep: false,
      incidentSettingsCollapsed: false,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      emphasizedSetupStepId: "verified",
    };
  }

  return {
    showNotConfiguredNextStep: false,
    incidentSettingsCollapsed: false,
    showConnectionTest: true,
    connectionTestCollapsed: false,
    emphasizedSetupStepId: "verified",
  };
}

export function resolveServiceNowSetupSteps(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly probe: ItsmIntegrationHealthResponse["serviceNow"] | null | undefined;
}): readonly ServiceNowSetupStep[] {
  return [
    {
      id: "native",
      label: "Outbound incident creation enabled",
      complete: input.nativeEnabled === true,
    },
    {
      id: "credentials",
      label: "Secure credentials configured",
      complete: input.credentialsReady,
    },
    {
      id: "verified",
      label: "Connection verified",
      complete: input.probe?.reachable === true,
    },
  ];
}

export function sanitizeCustomerFacingProbeSummary(summary: string | null | undefined): string {
  const text = (summary ?? "").trim();

  if (text.length === 0) {
    return "";
  }

  if (/Integrations:ItsmOutbound/i.test(text)) {
    return "ServiceNow credentials are not configured for this workspace.";
  }

  if (/host configuration|Key Vault materialization|tenant SQL|vendor probe/i.test(text)) {
    return "ServiceNow connection check could not complete with the current configuration.";
  }

  return text;
}

/**
 * Maps API problem titles / SQL mapper leaks out of Connection status.
 * Raw detail stays available to callers via loadError state / console diagnostics.
 */
export function sanitizeServiceNowLoadErrorForConnectionStatus(loadError: string): string {
  const trimmed = loadError.trim();

  if (trimmed.length === 0) {
    return SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION;
  }

  if (RAW_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[servicenow] connection status load failure (raw detail not shown to buyer):", trimmed);
    }

    return SERVICENOW_LOAD_FAILURE_STATUS_EXPLANATION;
  }

  return trimmed;
}
