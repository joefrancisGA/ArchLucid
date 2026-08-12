import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchHealth = vi.fn();
const mockFetchSettings = vi.fn();
const mockFetchConnection = vi.fn();
const mockUpsertSettings = vi.fn();

let canMutate = true;
let showOperatorNav = false;
let callerAuthorityRank = 2;

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => canMutate,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => callerAuthorityRank,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => showOperatorNav,
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchHealth(...args),
  fetchTenantItsmOutboundSettings: (...args: unknown[]) => mockFetchSettings(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
  upsertTenantItsmOutboundSettings: (...args: unknown[]) => mockUpsertSettings(...args),
}));

import { ServiceNowIntegrationPageClient } from "./ServiceNowIntegrationPageClient";
import { INTEGRATIONS_READINESS_PATH, INTEGRATIONS_SERVICENOW_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  SERVICENOW_CONNECTION_TEST_BUTTON,
  SERVICENOW_CREDENTIALS_ADMIN_REQUIRED,
  SERVICENOW_INCIDENT_SETTINGS_TITLE,
  SERVICENOW_INCIDENT_SETTINGS_UNAVAILABLE_LEAD,
  SERVICENOW_INTEGRATION_PAGE_DESCRIPTION,
  SERVICENOW_INTEGRATION_PAGE_TITLE,
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
    mockUpsertSettings.mockResolvedValue(baseSettings({ serviceNowAutoCreateCmdbCi: true }));
  });

  it("renders customer-facing header without internal language", async () => {
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByRole("heading", { name: SERVICENOW_INTEGRATION_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SERVICENOW_INTEGRATION_PAGE_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(/cloud connections/i)).toBeInTheDocument();

    const page = screen.getByTestId("integrations-servicenow-page");
    const text = page.textContent ?? "";

    for (const pattern of BANNED_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("TB-1171: page heading exposes nav icon via PageHeading", async () => {
    render(<ServiceNowIntegrationPageClient />);

    await screen.findByRole("heading", { name: SERVICENOW_INTEGRATION_PAGE_TITLE });
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-servicenow-page").querySelector("[data-nav-href]")).toHaveAttribute(
      "data-nav-href",
      INTEGRATIONS_SERVICENOW_PATH,
    );
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
  });

  it("TB-1161: offers Integration readiness CTA when not configured for non-admin", async () => {
    render(<ServiceNowIntegrationPageClient />);

    expect(await screen.findByTestId("integrations-servicenow-not-configured-next-step")).toBeInTheDocument();
    const readinessLink = screen.getByTestId("integrations-servicenow-readiness-cta");
    expect(readinessLink).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
    expect(screen.queryByTestId("integrations-servicenow-configure-admin-cta")).not.toBeInTheDocument();
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
    mockFetchHealth
      .mockResolvedValueOnce(
        baseHealth({
          serviceNow: { locallyConfigured: true, reachable: null, summary: "pending" },
        }),
      )
      .mockResolvedValueOnce(
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
    mockFetchHealth
      .mockResolvedValueOnce(
        baseHealth({
          serviceNow: { locallyConfigured: true, reachable: false, summary: "pending" },
        }),
      )
      .mockResolvedValueOnce(
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

  it("uses single-column layout after about-aside demotion (TB-1575)", async () => {
    render(<ServiceNowIntegrationPageClient />);
    await screen.findByTestId("integrations-servicenow-page");

    const grid = document.querySelector(".lg\\:grid-cols-\\[minmax\\(0\\,1fr\\)_17\\.5rem\\]");
    expect(grid).toBeNull();
    expect(screen.getByTestId("servicenow-integration-aside")).toBeInTheDocument();
    expect(screen.getByTestId("servicenow-integration-aside")).toHaveAttribute(
      "data-operator-side-rail-kind",
      "none",
    );
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
