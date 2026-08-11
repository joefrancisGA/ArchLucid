import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAzureHealth = vi.fn();
const mockFetchAzureSettings = vi.fn();
const mockFetchItsmHealth = vi.fn();
const mockFetchConnection = vi.fn();
const mockUpsertSettings = vi.fn();
const mockUpsertConnection = vi.fn();
const mockTestConnection = vi.fn();
const mockListProjects = vi.fn();
const mockListWorkItemTypes = vi.fn();

let canMutate = true;

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => canMutate,
}));

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: () => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/api/azure-boards-api", () => ({
  fetchAzureBoardsHealth: (...args: unknown[]) => mockFetchAzureHealth(...args),
  fetchAzureBoardsSettings: (...args: unknown[]) => mockFetchAzureSettings(...args),
  listAzureBoardsProjects: (...args: unknown[]) => mockListProjects(...args),
  listAzureBoardsWorkItemTypes: (...args: unknown[]) => mockListWorkItemTypes(...args),
  testAzureBoardsConnection: (...args: unknown[]) => mockTestConnection(...args),
  upsertAzureBoardsSettings: (...args: unknown[]) => mockUpsertSettings(...args),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchItsmHealth(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
  upsertTenantItsmConnectorConnection: (...args: unknown[]) => mockUpsertConnection(...args),
}));

import { AzureBoardsIntegrationPageClient } from "./AzureBoardsIntegrationPageClient";
import {
  AZURE_BOARDS_BANNED_UI_PATTERNS,
  AZURE_BOARDS_PAGE_SUBTITLE,
  AZURE_BOARDS_PAGE_TITLE,
  AZURE_BOARDS_TEST_CONNECTION_LABEL,
} from "@/lib/azure-boards-page-copy";

function baseHealth(overrides: Record<string, unknown> = {}) {
  return {
    status: "not_configured",
    reachable: false,
    summary: "Azure Boards credentials are not configured.",
    ...overrides,
  };
}

function baseSettings(overrides: Record<string, unknown> = {}) {
  return {
    isConfigured: false,
    projectName: null,
    defaultWorkItemType: null,
    ...overrides,
  };
}

function baseConnection(overrides: Record<string, unknown> = {}) {
  return {
    provider: "AzureBoards",
    isConfigured: false,
    instanceBaseUrl: null,
    credentialKeyVaultSecretName: null,
    ...overrides,
  };
}

describe("AzureBoardsIntegrationPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canMutate = true;
    mockFetchAzureHealth.mockResolvedValue(baseHealth());
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: true });
    mockFetchAzureSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());
    mockListProjects.mockResolvedValue([]);
    mockListWorkItemTypes.mockResolvedValue([]);
    mockUpsertSettings.mockResolvedValue(
      baseSettings({ isConfigured: true, projectName: "Pilot", defaultWorkItemType: "Issue" }),
    );
    mockUpsertConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );
    mockTestConnection.mockResolvedValue({ ok: true, summary: "Connection check succeeded." });
  });

  it("renders customer-facing header without banned API terminology", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    expect(await screen.findByTestId("azure-boards-page-title")).toHaveTextContent(AZURE_BOARDS_PAGE_TITLE);
    expect(screen.getByText(AZURE_BOARDS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-refresh-button")).toBeInTheDocument();

    const page = screen.getByTestId("integrations-azure-boards-page");
    const text = page.textContent ?? "";

    for (const pattern of AZURE_BOARDS_BANNED_UI_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("TB-1758: shows loading skeleton on first paint then content", async () => {
    let resolveSettings: (value: unknown) => void = () => undefined;
    const settingsPromise = new Promise((resolve) => {
      resolveSettings = resolve;
    });
    mockFetchAzureSettings.mockReturnValue(settingsPromise);

    render(<AzureBoardsIntegrationPageClient />);

    expect(screen.getByTestId("azure-boards-loading-skeleton")).toBeInTheDocument();

    resolveSettings(baseSettings());
    expect(await screen.findByTestId("azure-boards-page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-loading-skeleton")).not.toBeInTheDocument();
  });

  it("TB-1758: refresh keeps visible content when a slice fails", async () => {
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("azure-boards-organization-url")).toHaveValue("https://dev.azure.com/example");
    });

    mockFetchAzureSettings.mockRejectedValueOnce(new Error("temporary failure"));
    fireEvent.click(screen.getByTestId("azure-boards-refresh-button"));

    expect(screen.getByTestId("azure-boards-page-content")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-loading-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-organization-url")).toHaveValue("https://dev.azure.com/example");
  });

  it("TB-1757/1759: setup progress uses StatusTag and omits duplicate azure-boards help guide link", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-setup-progress");
    expect(screen.getByTestId("azure-boards-setup-step-credentials")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-help-guide-link")).not.toBeInTheDocument();

    const aside = screen.getByTestId("azure-boards-integration-aside");
    expect(aside.textContent ?? "").not.toContain("/help/azure-boards");
    expect(aside.textContent ?? "").not.toContain("/help/integrations/azure-boards");
  });

  it("shows setup incomplete and hides connection test until credentials exist (TB-1155)", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    const status = await screen.findByTestId("azure-boards-connection-status");
    expect(within(status).getByText("Setup incomplete")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-test-connection-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-default-behavior-collapsed")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-setup-step-credentials")).toHaveAttribute("data-emphasized", "true");
  });

  it("shows connected state when health probe succeeds", async () => {
    mockFetchAzureHealth.mockResolvedValue(baseHealth({ reachable: true, status: "healthy" }));
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({ isConfigured: true, projectName: "Pilot", defaultWorkItemType: "Issue" }),
    );
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    const status = await screen.findByTestId("azure-boards-connection-status");
    expect(within(status).getByText("Connected")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-test-connection-button")).toBeEnabled();
  });

  it("never redisplays saved token value in credential field", async () => {
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat-secret",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-token-reference");
    expect(screen.getByTestId("azure-boards-token-reference")).toHaveValue("");
    expect(screen.getByTestId("azure-boards-credential-status")).toHaveTextContent("Secure reference saved");
    expect(screen.queryByText("kv-pat-secret")).not.toBeInTheDocument();
  });

  it("runs connection test with pending and success feedback", async () => {
    mockFetchAzureHealth.mockResolvedValue(baseHealth({ reachable: true }));
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({ isConfigured: true, projectName: "Pilot", defaultWorkItemType: "Issue" }),
    );
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    const button = await screen.findByRole("button", { name: AZURE_BOARDS_TEST_CONNECTION_LABEL });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockTestConnection).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("azure-boards-latest-test")).toBeInTheDocument();
  });

  it("loads project and work item type discovery lists", async () => {
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );
    mockListProjects.mockResolvedValue(["Pilot", "Platform"]);
    mockListWorkItemTypes.mockResolvedValue(["Issue", "Epic"]);

    render(<AzureBoardsIntegrationPageClient />);

    await waitFor(() => {
      expect(mockListProjects).toHaveBeenCalled();
    });

    fireEvent.click(await screen.findByTestId("azure-boards-project-select"));
    expect(await screen.findByText("Platform")).toBeInTheDocument();
  });

  it("shows connection issue when probe fails", async () => {
    mockFetchAzureHealth.mockResolvedValue(
      baseHealth({ reachable: false, summary: "401 unauthorized from _apis/wit" }),
    );
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({ isConfigured: true, projectName: "Pilot", defaultWorkItemType: "Issue" }),
    );
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    const status = await screen.findByTestId("azure-boards-connection-status");
    expect(within(status).getByText("Connection issue")).toBeInTheDocument();
  });

  it("keeps connection fields when settings load fails (TB-1152)", async () => {
    mockFetchAzureSettings.mockRejectedValue(new Error("Database Query Failed"));
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/example",
        credentialKeyVaultSecretName: "kv-pat",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("azure-boards-organization-url")).toHaveValue("https://dev.azure.com/example");
    });

    expect(screen.getByTestId("azure-boards-connection-settings")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-credential-status")).toHaveTextContent("Secure reference saved");
  });

  it("never shows Database Query Failed as connection status explanation (TB-1153)", async () => {
    mockFetchAzureSettings.mockRejectedValue(
      new Error("Database Query Failed: The database rejected the query due to a programming error"),
    );

    render(<AzureBoardsIntegrationPageClient />);

    const status = await screen.findByTestId("azure-boards-connection-status");
    expect(within(status).getByText("Not available")).toBeInTheDocument();
    expect(status).not.toHaveTextContent(/Database Query Failed/i);
    expect(status).not.toHaveTextContent(/programming error/i);
    expect(status).toHaveTextContent(/could not load Azure Boards configuration/i);
  });

  it("hides configuration forms when work management integrations are disabled (TB-1154)", async () => {
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: false });

    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-connection-status");
    expect(screen.queryByTestId("azure-boards-connection-settings")).not.toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-default-behavior")).not.toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-connection-test")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-setup-step-credentials")).toHaveAttribute("data-emphasized", "true");
  });

  it("demotes default behavior until connection is saved (TB-1155)", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-connection-settings");
    expect(screen.getByTestId("azure-boards-default-behavior-collapsed")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-default-behavior")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save connection/i })).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-save-settings-button")).not.toBeInTheDocument();
  });
});
