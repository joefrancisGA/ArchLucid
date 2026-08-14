import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();
const mockFetchConnection = vi.fn();
const mockProbeHealth = vi.fn();
const mockUpsertSettings = vi.fn();

let canMutate = true;
let showOperatorNav = false;
let callerAuthorityRank = 2;

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => canMutate,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => callerAuthorityRank,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => showOperatorNav,
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => mockFetchSettings(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
  probeItsmIntegrationHealth: (...args: unknown[]) => mockProbeHealth(...args),
  upsertTenantItsmOutboundSettings: (...args: unknown[]) => mockUpsertSettings(...args),
}));

import { ServiceNowIntegrationPageClient } from "./ServiceNowIntegrationPageClient";
import { INTEGRATIONS_READINESS_PATH, INTEGRATIONS_SERVICENOW_PATH } from "@/lib/integrations-nav-paths";
import { SERVICENOW_INTEGRATION_SOURCES } from "@/lib/servicenow-integration-evidence-copy";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";
import { itsmConnectionStatusTagKind } from "@/lib/itsm/itsm-connection-status-tag-kind";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  SERVICENOW_CONNECTION_TEST_BUTTON,
  SERVICENOW_CREDENTIALS_ADMIN_REQUIRED,
  SERVICENOW_INCIDENT_SETTINGS_TITLE,
  SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD,
  SERVICENOW_INTEGRATION_PAGE_TITLE,
  SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_ADMIN,
  SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_OPERATOR,
  SERVICENOW_PAGE_SUBTITLE,
  SERVICENOW_SAVE_SETTINGS_BUTTON,
} from "@/lib/servicenow-integration-page-copy";

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
    serviceNow: {
      locallyConfigured: false,
      reachable: null,
      summary: "ServiceNow credentials are not configured.",
    },
    ...overrides,
  };
}

function baseSettings(overrides: Record<string, unknown> = {}) {
  return {
    nativeEnabled: true,
    serviceNowAutoCreateCmdbCi: false,
    deploymentCredentials: {
      serviceNowConfigured: false,
    },
    ...overrides,
  };
}

function baseConnection(overrides: Record<string, unknown> = {}) {
  return {
    provider: "servicenow",
    isConfigured: false,
    instanceBaseUrl: null,
    authMode: null,
    ...overrides,
  };
}

function credentialsReadyMocks(): void {
  mockFetchHealth.mockResolvedValue(
    baseHealth({
      serviceNow: { locallyConfigured: true, reachable: null, summary: "pending" },
    }),
  );
  mockFetchSettings.mockResolvedValue(
    baseSettings({
      deploymentCredentials: { serviceNowConfigured: true },
    }),
  );
  mockFetchConnection.mockResolvedValue(
    baseConnection({
      isConfigured: true,
      instanceBaseUrl: "https://example.service-now.com",
      authMode: "BasicApiToken",
    }),
  );
}

describe("ServiceNowIntegrationPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canMutate = true;
    showOperatorNav = false;
    callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;
    mockFetchHealth.mockResolvedValue(baseHealth());
    mockFetchSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());
    mockProbeHealth.mockResolvedValue(baseHealth());
    mockUpsertSettings.mockResolvedValue(baseSettings({ serviceNowAutoCreateCmdbCi: true }));
  });

  it("renders OperatorPageHeader with status badge and last-checked metadata", async () => {
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("servicenow-page-title")).toHaveTextContent(SERVICENOW_INTEGRATION_PAGE_TITLE);
    expect(screen.getByText(SERVICENOW_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByTestId("servicenow-page-breadcrumb")).toBeNull();
    expect(screen.getByTestId("servicenow-header-status-badge")).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-last-checked")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-servicenow-page").querySelector("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      INTEGRATIONS_SERVICENOW_PATH,
    );
  });

  it("renders buyer-safe copy without internal language", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByTestId("integrations-servicenow-page");
    const text = screen.getByTestId("integrations-servicenow-page").textContent ?? "";

    for (const pattern of BANNED_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("uses a single orientation rail without vocabulary rail above status", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByTestId("servicenow-connection-status");
    expect(screen.getByTestId("itsm-connector-provider-chooser")).toBeInTheDocument();
    expect(screen.queryByTestId("itsm-connectors-buyer-jira-servicenow-vocabulary")).not.toBeInTheDocument();

    const chooser = screen.getByTestId("itsm-connector-provider-chooser");
    const status = screen.getByTestId("servicenow-connection-status");
    expect(chooser.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the ServiceNow integration Sources and claim-discipline strip", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByTestId("servicenow-integration-orientation");

    const sources = screen.getByTestId("servicenow-integration-sources");

    for (const link of SERVICENOW_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    const readinessLinks = within(sources).getAllByRole("link", { name: "Integration readiness" });
    expect(readinessLinks).toHaveLength(1);
    expect(readinessLinks[0]).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
  });

  it("maps setup incomplete to needs-attention in header and section status tags", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByTestId("servicenow-connection-status");
    expect(itsmConnectionStatusTagKind("setup-incomplete")).toBe("needs-attention");
    expect(screen.getByTestId("servicenow-header-status-badge")).toHaveTextContent("Setup incomplete");
  });

  it("exposes enabled refresh and last checked when setup is incomplete", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByTestId("servicenow-connection-status");
    const refreshButton = screen.getByTestId("servicenow-refresh-button");
    expect(refreshButton).toBeEnabled();
    expect(screen.getByTestId("servicenow-last-checked")).toBeInTheDocument();
  });

  it("exposes refresh and integration readiness actions in the header", async () => {
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("servicenow-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-readiness-link")).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
  });

  it("shows setup incomplete state without connection test section", async () => {
    render(<ServiceNowIntegrationPageClient />);

    const status = await screen.findByTestId("servicenow-connection-status");
    expect(within(status).getByText("Setup incomplete")).toBeInTheDocument();
    expect(screen.getByText(SERVICENOW_CREDENTIALS_ADMIN_REQUIRED)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SERVICENOW_CONNECTION_TEST_BUTTON })).not.toBeInTheDocument();
    expect(screen.getByTestId("servicenow-incident-settings-collapsed")).toBeInTheDocument();
  });

  it("TB-1161: offers admin ITSM configure CTA when not configured", async () => {
    callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("integrations-servicenow-not-configured-next-step")).toBeInTheDocument();
    const configureLink = screen.getByTestId("integrations-servicenow-configure-admin-cta");
    expect(configureLink).toHaveAttribute("href", ITSM_CONNECTORS_ADMIN_PATH);
    expect(screen.getByText(SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_ADMIN)).toBeInTheDocument();
  });

  it("TB-1161: offers Integration readiness CTA when not configured for non-admin", async () => {
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("integrations-servicenow-not-configured-next-step")).toBeInTheDocument();
    const readinessLink = screen.getByTestId("integrations-servicenow-readiness-cta");
    expect(readinessLink).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
    expect(screen.queryByTestId("integrations-servicenow-configure-admin-cta")).not.toBeInTheDocument();
    expect(screen.getByText(SERVICENOW_NEXT_ACTION_SETUP_INCOMPLETE_OPERATOR)).toBeInTheDocument();
  });

  it("TB-1164: demotes incident settings when credentials are missing", async () => {
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("servicenow-incident-settings-collapsed")).toBeInTheDocument();
    expect(screen.getByText(SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: SERVICENOW_SAVE_SETTINGS_BUTTON })).not.toBeInTheDocument();
  });

  it("TB-1165: not-configured viewport has one primary control", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByTestId("integrations-servicenow-not-configured-next-step");
    const mainColumn = screen.getByTestId("servicenow-page-main");
    const primaryCta = within(mainColumn).getByTestId("integrations-servicenow-readiness-cta");

    expect(primaryCta).toBeInTheDocument();
    expect(within(mainColumn).queryAllByRole("button", { name: /save settings|test connection/i })).toHaveLength(0);
    expect(screen.getByTestId("servicenow-setup-step-credentials")).toHaveAttribute("data-emphasized", "true");
  });

  it("shows connected state when probe is reachable", async () => {
    mockFetchHealth.mockResolvedValue(
      baseHealth({
        serviceNow: { locallyConfigured: true, reachable: true, summary: "ready" },
      }),
    );
    mockFetchSettings.mockResolvedValue(
      baseSettings({
        deploymentCredentials: { serviceNowConfigured: true, serviceNowUsernameMasked: "svc••••" },
      }),
    );
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://example.service-now.com",
        authMode: "BasicApiToken",
      }),
    );

    render(<ServiceNowIntegrationPageClient />);

    const status = await screen.findByTestId("servicenow-connection-status");
    expect(within(status).getByText("Connected")).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-instance-url")).toHaveTextContent("https://example.service-now.com");
    expect(screen.getByRole("button", { name: SERVICENOW_CONNECTION_TEST_BUTTON })).toBeEnabled();
  });

  it("shows connection issue state when probe fails", async () => {
    mockFetchHealth.mockResolvedValue(
      baseHealth({
        serviceNow: { locallyConfigured: true, reachable: false, summary: "401 unauthorized" },
      }),
    );
    mockFetchSettings.mockResolvedValue(
      baseSettings({
        deploymentCredentials: { serviceNowConfigured: true },
      }),
    );

    render(<ServiceNowIntegrationPageClient />);

    const status = await screen.findByTestId("servicenow-connection-status");
    expect(within(status).getByText("Connection issue")).toBeInTheDocument();
    expect(within(status).getByText(/401 unauthorized/i)).toBeInTheDocument();
  });

  it("blocks save when user lacks mutation capability", async () => {
    canMutate = false;
    credentialsReadyMocks();
    render(<ServiceNowIntegrationPageClient />);

    const saveButton = await screen.findByRole("button", { name: SERVICENOW_SAVE_SETTINGS_BUTTON });
    expect(saveButton).toBeDisabled();
    expect(screen.getByText(/Elevated workspace permissions/i)).toBeInTheDocument();
  });

  it("saves incident creation settings with pending and success feedback", async () => {
    credentialsReadyMocks();
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByRole("heading", { name: SERVICENOW_INCIDENT_SETTINGS_TITLE });
    fireEvent.click(screen.getByLabelText(/Create a Configuration Item when no match is found/i));
    fireEvent.click(screen.getByRole("button", { name: SERVICENOW_SAVE_SETTINGS_BUTTON }));

    expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();

    await waitFor(() => {
      expect(mockUpsertSettings).toHaveBeenCalledWith({ serviceNowAutoCreateCmdbCi: true });
    });

    expect(await screen.findByText(/Incident creation settings saved/i)).toBeInTheDocument();
  });

  it("surfaces save failure without clearing unsaved checkbox state", async () => {
    mockUpsertSettings.mockRejectedValue(new Error("Save rejected"));
    credentialsReadyMocks();

    render(<ServiceNowIntegrationPageClient />);
    await screen.findByRole("heading", { name: SERVICENOW_INCIDENT_SETTINGS_TITLE });

    const checkbox = screen.getByLabelText(/Create a Configuration Item when no match is found/i);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: SERVICENOW_SAVE_SETTINGS_BUTTON }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Save rejected");
    expect(checkbox).toBeChecked();
  });

  it("runs connection test with pending, success, and aside timestamp", async () => {
    mockFetchHealth.mockResolvedValue(
      baseHealth({
        serviceNow: { locallyConfigured: true, reachable: null, summary: "pending" },
      }),
    );
    mockProbeHealth.mockResolvedValue(
      baseHealth({
        serviceNow: { locallyConfigured: true, reachable: true, summary: "Connection check succeeded." },
      }),
    );
    mockFetchSettings.mockResolvedValue(
      baseSettings({
        deploymentCredentials: { serviceNowConfigured: true },
      }),
    );

    render(<ServiceNowIntegrationPageClient />);

    const testButton = await screen.findByRole("button", { name: SERVICENOW_CONNECTION_TEST_BUTTON });
    await waitFor(() => expect(testButton).toBeEnabled());

    fireEvent.click(testButton);
    expect(screen.getByRole("button", { name: /Testing connection/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByTestId("servicenow-latest-test")).toBeInTheDocument();
    });
    expect(screen.getByText(/Connection check succeeded/i)).toBeInTheDocument();
  });

  it("shows connection test failure feedback", async () => {
    mockFetchHealth.mockResolvedValue(
      baseHealth({
        serviceNow: { locallyConfigured: true, reachable: false, summary: "pending" },
      }),
    );
    mockProbeHealth.mockResolvedValue(
      baseHealth({
        serviceNow: { locallyConfigured: true, reachable: false, summary: "403 forbidden" },
      }),
    );
    mockFetchSettings.mockResolvedValue(
      baseSettings({
        deploymentCredentials: { serviceNowConfigured: true },
      }),
    );

    render(<ServiceNowIntegrationPageClient />);

    const testButton = await screen.findByRole("button", { name: SERVICENOW_CONNECTION_TEST_BUTTON });
    await waitFor(() => expect(testButton).toBeEnabled());
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByTestId("servicenow-latest-test")).toBeInTheDocument();
    });
    expect(within(screen.getByTestId("servicenow-latest-test")).getByText(/403 forbidden/i)).toBeInTheDocument();
  });

  it("stacks setup guidance below the connect form (TB-1575 / TB-1576 demoted single-column)", async () => {
    render(<ServiceNowIntegrationPageClient />);
    await screen.findByTestId("integrations-servicenow-page");

    const layout = screen.getByTestId("servicenow-page-layout");
    expect(layout.className).not.toContain("lg:grid-cols-[minmax(0,1fr)_17.5rem]");
    expect(screen.getByTestId("servicenow-integration-aside").className).not.toContain("lg:sticky");
    expect(screen.getByTestId("servicenow-setup-progress")).toBeInTheDocument();
  });

  it("exposes meaningful status region for accessibility", async () => {
    render(<ServiceNowIntegrationPageClient />);
    const status = await screen.findByTestId("servicenow-connection-status");
    expect(within(status).getByRole("status")).toBeInTheDocument();
  });

  it("shows operator notes only when system administration nav is enabled", async () => {
    showOperatorNav = true;
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("servicenow-operator-notes")).toBeInTheDocument();
  });

  it("keeps connection fields when settings load fails (TB-1162)", async () => {
    mockFetchSettings.mockRejectedValue(new Error("Database Query Failed"));
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://example.service-now.com",
        authMode: "BasicApiToken",
      }),
    );

    render(<ServiceNowIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("servicenow-instance-url")).toHaveTextContent("https://example.service-now.com");
    });

    expect(screen.getByTestId("servicenow-credential-status")).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-page-load-error")).toHaveTextContent("Database Query Failed");
    expect(screen.getByTestId("servicenow-connection-status")).not.toHaveTextContent(/Database Query Failed/i);
    expect(screen.getByRole("button", { name: SERVICENOW_SAVE_SETTINGS_BUTTON })).toBeDisabled();
  });

  it("never shows Database Query Failed as connection status explanation (TB-1163)", async () => {
    mockFetchConnection.mockRejectedValue(
      new Error("Database Query Failed: The database rejected the query due to a programming error"),
    );

    render(<ServiceNowIntegrationPageClient />);

    const status = await screen.findByTestId("servicenow-connection-status");
    expect(within(status).getByText("Not available")).toBeInTheDocument();
    expect(status).not.toHaveTextContent(/Database Query Failed/i);
    expect(status).not.toHaveTextContent(/programming error/i);
    expect(status).toHaveTextContent(/could not load ServiceNow configuration/i);
  });
});
