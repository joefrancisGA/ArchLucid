import type {
  ItsmIntegrationHealthResponse,
  TenantItsmConnectorConnectionResponse,
  TenantItsmOutboundSettingsResponse,
} from "@/lib/api/itsm-outbound-api";

import {
  JIRA_AUTH_METHOD_UNKNOWN,
  JIRA_AUTH_OAUTH_ATLASSIAN,
  JIRA_CREDENTIAL_STATUS_CONFIGURED,
  JIRA_CREDENTIAL_STATUS_NOT_CONFIGURED,
} from "./jira-integration-page-copy";
import { sanitizeItsmCustomerFacingProbeSummary } from "./itsm/itsm-product-integration-page-copy";
import {
  whyDisabledBusy,
  whyDisabledEnterpriseMutationControl,
  whyDisabledNeedsPrerequisite,
  type WhyDisabledCtaReason,
} from "./why-disabled-cta";

export type JiraConnectionStatus =
  | "connected"
  | "setup-incomplete"
  | "connection-issue"
  | "testing"
  | "not-available";

export type JiraConnectionStatusPresentation = {
  readonly status: JiraConnectionStatus;
  readonly label: string;
  readonly explanation: string;
  readonly nextAction: string;
};

export type JiraConnectionTestGate = {
  readonly allowed: boolean;
  readonly reason: string | null;
};

export type JiraAtlassianOAuthConnectGate = {
  readonly allowed: boolean;
  readonly reason: WhyDisabledCtaReason | null;
};

export type JiraSetupStep = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
};

export type JiraPageComposition = {
  readonly showWorkspaceRouting: boolean;
  readonly workspaceRoutingCollapsed: boolean;
  readonly showConnectionTest: boolean;
  readonly connectionTestCollapsed: boolean;
  readonly emphasizedSetupStepId: string;
  readonly showNotConfiguredNextStep: boolean;
};

const STATUS_LABELS: Record<JiraConnectionStatus, string> = {
  connected: "Connected",
  "setup-incomplete": "Setup incomplete",
  "connection-issue": "Connection issue",
  testing: "Testing",
  "not-available": "Not available",
};

export const JIRA_LOAD_FAILURE_STATUS_EXPLANATION =
  "ArchLucid could not load Jira configuration for this workspace. Reload the page or contact support if the problem continues.";

const RAW_LOAD_ERROR_PATTERNS: readonly RegExp[] = [
  /database query failed/i,
  /programming error/i,
  /the database rejected the query/i,
  /\b5\d{2}\b/,
  /internal server error/i,
];

const CREDENTIALS_NOT_CONFIGURED_PHRASE = "credentials are not configured";

export function isJiraCredentialsReady(
  settings: TenantItsmOutboundSettingsResponse | null | undefined,
  _connection: TenantItsmConnectorConnectionResponse | null | undefined,
  probe: ItsmIntegrationHealthResponse["jira"] | null | undefined,
): boolean {
  if (settings?.deploymentCredentials?.jiraConfigured === true) {
    return true;
  }

  return probe?.locallyConfigured === true;
}

export function isJiraAtlassianOAuthConnectReady(
  connection: TenantItsmConnectorConnectionResponse | null | undefined,
): boolean {
  const instanceBaseUrl = connection?.instanceBaseUrl?.trim() ?? "";
  const clientIdRef = connection?.oAuthClientIdKeyVaultSecretName?.trim() ?? "";
  const clientSecretRef = connection?.oAuthClientSecretKeyVaultSecretName?.trim() ?? "";
  const refreshTokenRef = connection?.oAuthRefreshTokenKeyVaultSecretName?.trim() ?? "";

  return (
    instanceBaseUrl.length > 0 &&
    clientIdRef.length > 0 &&
    clientSecretRef.length > 0 &&
    refreshTokenRef.length > 0
  );
}

export function resolveJiraAtlassianOAuthConnectGate(input: {
  readonly canMutate: boolean;
  readonly oauthConnectReady: boolean;
  readonly isConnecting: boolean;
}): JiraAtlassianOAuthConnectGate {
  if (input.isConnecting) {
    return { allowed: false, reason: whyDisabledBusy("Atlassian consent") };
  }

  if (!input.canMutate) {
    return { allowed: false, reason: whyDisabledEnterpriseMutationControl() };
  }

  if (!input.oauthConnectReady) {
    return {
      allowed: false,
      reason: whyDisabledNeedsPrerequisite("OAuth client references in ITSM administration"),
    };
  }

  return { allowed: true, reason: null };
}

export function resolveJiraConnectionStatus(input: {
  readonly isLoading: boolean;
  readonly loadError: string | null;
  readonly isTesting: boolean;
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly oauthConnectReady: boolean;
  readonly probe: ItsmIntegrationHealthResponse["jira"] | null | undefined;
}): JiraConnectionStatusPresentation {
  if (input.isTesting) {
    return {
      status: "testing",
      label: STATUS_LABELS.testing,
      explanation: "ArchLucid is checking connectivity to Jira.",
      nextAction: "Wait for the connection test to finish.",
    };
  }

  if (input.isLoading) {
    return {
      status: "testing",
      label: "Loading",
      explanation: "Loading Jira configuration for this workspace.",
      nextAction: "Wait for configuration to load.",
    };
  }

  if (input.loadError !== null) {
    return {
      status: "not-available",
      label: STATUS_LABELS["not-available"],
      explanation: sanitizeJiraLoadErrorForConnectionStatus(input.loadError),
      nextAction: "Reload the page or contact support if the problem continues.",
    };
  }

  if (input.nativeEnabled !== true) {
    return {
      status: "not-available",
      label: STATUS_LABELS["not-available"],
      explanation: "Outbound Jira ticket creation is not enabled for this deployment.",
      nextAction: "Ask your platform administrator to enable Jira outbound integration.",
    };
  }

  if (!input.credentialsReady) {
    return {
      status: "setup-incomplete",
      label: STATUS_LABELS["setup-incomplete"],
      explanation: input.oauthConnectReady
        ? "Jira credentials are not configured for this workspace."
        : "Jira outbound integration setup has not started for this workspace.",
      nextAction: input.oauthConnectReady
        ? "Use Connect with Atlassian in the header to complete OAuth consent."
        : "Configure OAuth client references in ITSM administration, then connect with Atlassian.",
    };
  }

  if (input.probe?.reachable === true) {
    return {
      status: "connected",
      label: STATUS_LABELS.connected,
      explanation: "ArchLucid can reach Jira with the configured credentials.",
      nextAction: "You can create issues from findings or run another connection test.",
    };
  }

  if (input.probe?.reachable === false) {
    const detail = sanitizeCustomerFacingJiraProbeSummary(input.probe.summary);

    return {
      status: "connection-issue",
      label: STATUS_LABELS["connection-issue"],
      explanation:
        detail.length > 0
          ? detail
          : "ArchLucid could not reach Jira with the current credentials.",
      nextAction: "Verify the site URL and OAuth consent, then test the connection again.",
    };
  }

  return {
    status: "setup-incomplete",
    label: STATUS_LABELS["setup-incomplete"],
    explanation: "Credentials are recorded but a successful connection check has not completed yet.",
    nextAction: "Run a connection test after setup is complete.",
  };
}

export function resolveJiraConnectionTestGate(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly isTesting: boolean;
  readonly isSaving: boolean;
}): JiraConnectionTestGate {
  if (input.isTesting) {
    return { allowed: false, reason: "A connection test is already running." };
  }

  if (input.isSaving) {
    return { allowed: false, reason: "Wait until settings finish saving." };
  }

  if (input.nativeEnabled !== true) {
    return {
      allowed: false,
      reason: "Outbound Jira ticket creation is not enabled for this deployment.",
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

export function resolveJiraPageComposition(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly oauthConnectReady: boolean;
  readonly testGateAllowed: boolean;
  readonly credentialsStateKnown: boolean;
}): JiraPageComposition {
  if (!input.nativeEnabled) {
    return {
      showWorkspaceRouting: false,
      workspaceRoutingCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: false,
      emphasizedSetupStepId: "native",
      showNotConfiguredNextStep: false,
    };
  }

  if (!input.credentialsReady) {
    return {
      showWorkspaceRouting: false,
      workspaceRoutingCollapsed: true,
      showConnectionTest: false,
      connectionTestCollapsed: false,
      emphasizedSetupStepId: "consent",
      showNotConfiguredNextStep: input.credentialsStateKnown && !input.oauthConnectReady,
    };
  }

  if (!input.testGateAllowed) {
    return {
      showWorkspaceRouting: true,
      workspaceRoutingCollapsed: false,
      showConnectionTest: false,
      connectionTestCollapsed: true,
      emphasizedSetupStepId: "verified",
      showNotConfiguredNextStep: false,
    };
  }

  return {
    showWorkspaceRouting: true,
    workspaceRoutingCollapsed: false,
    showConnectionTest: true,
    connectionTestCollapsed: false,
    emphasizedSetupStepId: "verified",
    showNotConfiguredNextStep: false,
  };
}

export function resolveJiraSetupSteps(input: {
  readonly nativeEnabled: boolean;
  readonly oauthConnectReady: boolean;
  readonly credentialsReady: boolean;
  readonly probe: ItsmIntegrationHealthResponse["jira"] | null | undefined;
}): readonly JiraSetupStep[] {
  return [
    {
      id: "native",
      label: "Outbound ticket creation enabled",
      complete: input.nativeEnabled === true,
    },
    {
      id: "oauth",
      label: "OAuth client references configured",
      complete: input.oauthConnectReady,
    },
    {
      id: "consent",
      label: "Atlassian consent completed",
      complete: input.credentialsReady,
    },
    {
      id: "verified",
      label: "Connection verified",
      complete: input.probe?.reachable === true,
    },
  ];
}

export function formatJiraAuthMethod(authMode: string | null | undefined): string {
  const normalized = authMode?.trim();

  if (normalized === "OAuth2RefreshToken") {
    return JIRA_AUTH_OAUTH_ATLASSIAN;
  }

  return JIRA_AUTH_METHOD_UNKNOWN;
}

export function resolveJiraCredentialStatusLabel(
  settings: TenantItsmOutboundSettingsResponse | null | undefined,
  credentialsReady: boolean,
): string {
  if (!credentialsReady) {
    return JIRA_CREDENTIAL_STATUS_NOT_CONFIGURED;
  }

  const maskedEmail = settings?.deploymentCredentials?.jiraServiceAccountEmailMasked?.trim();

  if (maskedEmail && maskedEmail.length > 0) {
    return `${JIRA_CREDENTIAL_STATUS_CONFIGURED} (${maskedEmail})`;
  }

  return JIRA_CREDENTIAL_STATUS_CONFIGURED;
}

export function sanitizeCustomerFacingJiraProbeSummary(summary: string | null | undefined): string {
  return sanitizeItsmCustomerFacingProbeSummary(summary, "jira");
}

export function sanitizeJiraLoadErrorForConnectionStatus(loadError: string): string {
  const trimmed = loadError.trim();

  if (trimmed.length === 0) {
    return JIRA_LOAD_FAILURE_STATUS_EXPLANATION;
  }

  if (RAW_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[jira] connection status load failure (raw detail not shown to buyer):", trimmed);
    }

    return JIRA_LOAD_FAILURE_STATUS_EXPLANATION;
  }

  return trimmed;
}

/** Guard for tests — credentials-not-configured copy must appear at most once in not-configured state. */
export function jiraCredentialsNotConfiguredPhraseCount(text: string): number {
  const pattern = new RegExp(CREDENTIALS_NOT_CONFIGURED_PHRASE, "gi");
  const matches = text.match(pattern);

  return matches?.length ?? 0;
}
