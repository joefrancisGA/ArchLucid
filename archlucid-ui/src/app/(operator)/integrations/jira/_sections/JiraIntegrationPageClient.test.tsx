import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();
const mockFetchConnection = vi.fn();
const mockProbeHealth = vi.fn();
const mockUpsertSettings = vi.fn();
const mockLaunchOAuth = vi.fn();

let canMutate = true;
const featureMocks = vi.hoisted(() => ({
  showOperatorNav: false,
}));
let callerAuthorityRank = 0;

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => canMutate,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => callerAuthorityRank,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => featureMocks.showOperatorNav,
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => mockFetchSettings(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
  probeItsmIntegrationHealth: (...args: unknown[]) => mockProbeHealth(...args),
  upsertTenantItsmOutboundSettings: (...args: unknown[]) => mockUpsertSettings(...args),
}));

vi.mock("@/lib/jira-atlassian-oauth-connect", () => ({
  launchJiraAtlassianOAuthConnect: (...args: unknown[]) => mockLaunchOAuth(...args),
}));

import { JiraIntegrationPageClient } from "./JiraIntegrationPageClient";
import { INTEGRATIONS_JIRA_PATH, INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { JIRA_INTEGRATION_SOURCES } from "@/lib/jira-integration-evidence-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  JIRA_CONNECT_WITH_ATLASSIAN_LABEL,
  JIRA_CONNECTION_TEST_BUTTON,
  JIRA_INTEGRATION_PAGE_TITLE,
  JIRA_PAGE_SUBTITLE,
  JIRA_SAVE_SETTINGS_BUTTON,
  JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY,
  JIRA_WORKSPACE_ROUTING_TITLE,
} from "@/lib/jira-integration-page-copy";
import { jiraCredentialsNotConfiguredPhraseCount } from "@/lib/jira-integration-present";

const BANNED_PATTERNS = [
  /Integrations:ItsmOutbound/i,
  /host configuration/i,
  /Key Vault materialization/i,
  /tenant SQL/i,
  /vendor probes?/i,
  /smoke checklist/i,
  /single-tenant pilot fallback/i,
];

function baseHealth(overrides: Record<string, unknown> = {}) {
  return {
    nativeEnabled: true,
    jira: {
      locallyConfigured: false,
      reachable: null,
      summary: "Integrations:ItsmOutbound:Jira:CloudBaseUrl is missing from host configuration.",
    },
    serviceNow: { locallyConfigured: false, summary: "skip" },
    ...overrides,
  };
}

function baseSettings(overrides: Record<string, unknown> = {}) {
  return {
    nativeEnabled: true,
    deploymentCredentials: {
      jiraConfigured: false,
    },
    ...overrides,
  };
}

function baseConnection(overrides: Record<string, unknown> = {}) {
  return {
    provider: "jira",
    isConfigured: false,
    instanceBaseUrl: null,
    authMode: null,
    ...overrides,
  };
}

function oauthReadyConnection(): Record<string, unknown> {
  return {
    isConfigured: false,
    instanceBaseUrl: "https://example.atlassian.net",
    authMode: "OAuth2RefreshToken",
    oAuthClientIdKeyVaultSecretName: "jira-client-id",
    oAuthClientSecretKeyVaultSecretName: "jira-client-secret",
    oAuthRefreshTokenKeyVaultSecretName: "jira-refresh-token",
  };
}

function basePageBundle(overrides: {
  health?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  connection?: Record<string, unknown>;
} = {}) {
  return {
    health: baseHealth(overrides.health),
    settings: baseSettings(overrides.settings),
    connection: baseConnection(overrides.connection),
  };
}

function applyPageBundleMocks(
  overrides: {
    health?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    connection?: Record<string, unknown>;
  } = {},
): void {
  const bundle = basePageBundle(overrides);
  mockFetchHealth.mockResolvedValue(bundle.health);
  mockFetchSettings.mockResolvedValue(bundle.settings);
  mockFetchConnection.mockResolvedValue(bundle.connection);
}

function credentialsReadyMocks(): void {
  applyPageBundleMocks({
    health: {
      jira: { locallyConfigured: true, reachable: null, summary: "pending" },
    },
    settings: {
      deploymentCredentials: { jiraConfigured: true },
    },
    connection: {
      isConfigured: true,
      instanceBaseUrl: "https://example.atlassian.net",
      authMode: "OAuth2RefreshToken",
    },
  });
}

describe("JiraIntegrationPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canMutate = true;
    featureMocks.showOperatorNav = false;
    callerAuthorityRank = 0;
    applyPageBundleMocks();
    mockProbeHealth.mockResolvedValue(baseHealth());
    mockUpsertSettings.mockResolvedValue(baseSettings({ jiraProjectKeyOverride: "ARCH" }));
    mockLaunchOAuth.mockResolvedValue(undefined);
  });

  it("renders OperatorPageHeader with status badge and last-checked metadata", async () => {
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByTestId("jira-page-title")).toHaveTextContent(JIRA_INTEGRATION_PAGE_TITLE);
    expect(screen.getByText(JIRA_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("jira-page-breadcrumb")).toBeNull();
    expect(screen.getByTestId("jira-header-status-badge")).toBeInTheDocument();
    expect(screen.getByTestId("jira-last-checked")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-jira-page").querySelector("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      INTEGRATIONS_JIRA_PATH,
    );
  });

  it("renders buyer-safe copy without deployment-operator leakage", async () => {
    render(<JiraIntegrationPageClient />);

    await screen.findByTestId("integrations-jira-page");
    const text = screen.getByTestId("integrations-jira-page").textContent ?? "";

    for (const pattern of BANNED_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("uses a single orientation rail with ServiceNow peer link above status", async () => {
    render(<JiraIntegrationPageClient />);

    await screen.findByTestId("jira-connection-status");
    expect(screen.getByTestId("itsm-connector-provider-chooser")).toBeInTheDocument();
    expect(screen.queryByTestId("itsm-connectors-buyer-jira-servicenow-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("itsm-connector-provider-chooser-peer-servicenow")).toBeInTheDocument();

    const chooser = screen.getByTestId("itsm-connector-provider-chooser");
    const status = screen.getByTestId("jira-connection-status");
    expect(chooser.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the Jira integration Sources and claim-discipline strip", async () => {
    render(<JiraIntegrationPageClient />);

    await screen.findByTestId("jira-integration-orientation");

    const sources = screen.getByTestId("jira-integration-sources");

    for (const link of filterWhereToGoNextFollowUpLinks(JIRA_INTEGRATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(link.href, link.label);
      expect(within(sources).getByRole("link", { name: accessibleName })).toHaveAttribute("href", link.href);
    }

    expect(within(sources).queryByRole("link", { name: "Open Integration readiness" })).not.toBeInTheDocument();
    expect(screen.getByTestId("jira-readiness-link")).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
  });

  it("states credentials-not-configured exactly once in not-configured state", async () => {
    render(<JiraIntegrationPageClient />);

    await screen.findByTestId("jira-connection-status");
    const pageText = screen.getByTestId("integrations-jira-page").textContent ?? "";
    expect(jiraCredentialsNotConfiguredPhraseCount(pageText)).toBe(1);
  });

  it("renders Connect with Atlassian in the header", async () => {
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByRole("button", { name: JIRA_CONNECT_WITH_ATLASSIAN_LABEL })).toBeInTheDocument();
  });

  it("shows visible disabled reason for Connect with Atlassian when OAuth refs are missing", async () => {
    render(<JiraIntegrationPageClient />);

    const connectButton = await screen.findByTestId("jira-connect-with-atlassian-button");
    expect(connectButton).toBeDisabled();
    expect(screen.getByTestId("jira-connect-with-atlassian-disabled-helper")).toHaveTextContent(
      /OAuth client references in ITSM administration/i,
    );
  });

  it("launches Atlassian OAuth when prerequisites are ready", async () => {
    applyPageBundleMocks({ connection: oauthReadyConnection() });

    render(<JiraIntegrationPageClient />);

    const connectButton = await screen.findByTestId("jira-connect-with-atlassian-button");
    await waitFor(() => expect(connectButton).toBeEnabled());
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockLaunchOAuth).toHaveBeenCalledTimes(1);
    });
  });

  it("shows setup checklist in aside and collapsed workspace routing when unconfigured", async () => {
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByTestId("jira-setup-progress")).toBeInTheDocument();
    expect(screen.getByTestId("jira-setup-step-connect")).toHaveAttribute("data-emphasized", "true");
    expect(screen.getByTestId("jira-workspace-routing-collapsed")).toBeInTheDocument();
    expect(screen.getByText(JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Jira project key override/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: JIRA_CONNECTION_TEST_BUTTON })).not.toBeInTheDocument();
  });

  it("shows connected state and enables connection test when probe is reachable", async () => {
    applyPageBundleMocks({
      health: {
        jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      },
      settings: {
        deploymentCredentials: { jiraConfigured: true },
      },
      connection: {
        isConfigured: true,
        instanceBaseUrl: "https://example.atlassian.net",
        authMode: "OAuth2RefreshToken",
      },
    });

    render(<JiraIntegrationPageClient />);

    const status = await screen.findByTestId("jira-connection-status");
    expect(within(status).getByText("Connected")).toBeInTheDocument();
    expect(screen.getByTestId("jira-site-url")).toHaveTextContent("https://example.atlassian.net");
    expect(screen.getByRole("button", { name: JIRA_CONNECTION_TEST_BUTTON })).toBeEnabled();
  });

  it("saves workspace routing settings when credentials are ready", async () => {
    credentialsReadyMocks();
    render(<JiraIntegrationPageClient />);

    await screen.findByRole("heading", { name: JIRA_WORKSPACE_ROUTING_TITLE });
    fireEvent.change(screen.getByLabelText(/Jira project key override/i), { target: { value: "ARCH" } });
    fireEvent.click(screen.getByRole("button", { name: JIRA_SAVE_SETTINGS_BUTTON }));

    await waitFor(() => {
      expect(mockUpsertSettings).toHaveBeenCalledWith({
        jiraProjectKeyOverride: "ARCH",
        jiraSendInfoSeverity: false,
        jiraIssueTypeBySeverityJson: null,
      });
    });
  });

  it("exposes refresh and integration readiness actions in the header", async () => {
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByTestId("jira-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("jira-readiness-link")).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
  });

  it("shows configure-admin CTA when OAuth refs are missing and caller is admin", async () => {
    callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByTestId("integrations-jira-not-configured-next-step")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-jira-configure-admin-cta")).toBeInTheDocument();
  });

  it("shows operator readiness CTA when OAuth refs are missing and caller is not admin", async () => {
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByTestId("integrations-jira-not-configured-next-step")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-jira-readiness-cta")).toBeInTheDocument();
    expect(screen.queryByTestId("integrations-jira-configure-admin-cta")).not.toBeInTheDocument();
  });

  it("does not show not-configured next step when OAuth refs are ready but consent is pending", async () => {
    applyPageBundleMocks({ connection: oauthReadyConnection() });

    render(<JiraIntegrationPageClient />);

    await screen.findByTestId("jira-connection-status");
    expect(screen.queryByTestId("integrations-jira-not-configured-next-step")).not.toBeInTheDocument();
    const pageText = screen.getByTestId("integrations-jira-page").textContent ?? "";
    expect(jiraCredentialsNotConfiguredPhraseCount(pageText)).toBe(1);
  });

  it("does not claim not-configured when health load fails (TB-1146)", async () => {
    mockFetchHealth.mockRejectedValue(new Error("health probe unavailable"));
    mockFetchSettings.mockRejectedValue(new Error("health probe unavailable"));
    mockFetchConnection.mockRejectedValue(new Error("health probe unavailable"));

    render(<JiraIntegrationPageClient />);

    await screen.findByTestId("jira-page-load-error");
    expect(screen.queryByTestId("integrations-jira-not-configured-next-step")).not.toBeInTheDocument();
  });

  it("keeps connection fields when settings load fails (TB-1162)", async () => {
    mockFetchHealth.mockResolvedValue(
      baseHealth({
        jira: { locallyConfigured: true, reachable: null, summary: "pending" },
      }),
    );
    mockFetchSettings.mockRejectedValue(new Error("Database Query Failed"));
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://example.atlassian.net",
        authMode: "OAuth2RefreshToken",
      }),
    );

    render(<JiraIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("jira-site-url")).toHaveTextContent("https://example.atlassian.net");
    });

    expect(screen.getByTestId("jira-credential-status")).toBeInTheDocument();
    expect(screen.getByTestId("jira-page-load-error")).toHaveTextContent("Database Query Failed");
    expect(screen.getByTestId("jira-connection-status")).not.toHaveTextContent(/Database Query Failed/i);
    expect(screen.getByRole("button", { name: JIRA_SAVE_SETTINGS_BUTTON })).toBeDisabled();
  });

  it("shows operator notes only when system administration nav is enabled", async () => {
    featureMocks.showOperatorNav = true;
    render(<JiraIntegrationPageClient />);

    expect(await screen.findByTestId("jira-operator-notes")).toBeInTheDocument();
  });
});
