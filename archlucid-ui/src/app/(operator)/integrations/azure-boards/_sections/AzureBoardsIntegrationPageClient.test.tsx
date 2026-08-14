import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("TB-1756: uses operator spacing tokens instead of marketing-scale py-8 / space-y-8", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    const page = await screen.findByTestId("integrations-azure-boards-page");
    expect(page.className).toContain("space-y-6");
    expect(page.className).toContain("py-4");
    expect(page.className).not.toContain("space-y-8");
    expect(page.className).not.toContain("py-8");
    expect(page.className).not.toContain("py-6");
  });

  it("TB-1757: setup progress uses StatusTag without teal chip classes", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    const aside = await screen.findByTestId("azure-boards-integration-aside");
    expect(aside.innerHTML).not.toMatch(/border-teal-/);
    expect(within(screen.getByTestId("azure-boards-setup-step-credentials")).getByText("In progress")).toBeInTheDocument();
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

    let resolveSettings: (value: unknown) => void = () => undefined;
    const settingsPromise = new Promise((resolve) => {
      resolveSettings = resolve;
    });
    mockFetchAzureSettings.mockReturnValueOnce(settingsPromise);
    fireEvent.click(screen.getByTestId("azure-boards-refresh-button"));

    expect(screen.getByTestId("azure-boards-page-content")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-refresh-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-loading-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-organization-url")).toHaveValue("https://dev.azure.com/example");

    resolveSettings(baseSettings());
    await waitFor(() => {
      expect(screen.queryByTestId("azure-boards-refresh-skeleton")).not.toBeInTheDocument();
    });
  });

  it("links documentation to Azure Boards help topic and troubleshooting", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-setup-progress");
    expect(screen.getByTestId("azure-boards-help-guide-link")).toHaveAttribute("href", "/help/azure-boards");
    expect(screen.getByRole("link", { name: "Azure Boards integration guide" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Troubleshooting" })).toHaveAttribute("href", "/help/troubleshooting");
  });

  it("shows setup incomplete with needs-attention status tag on first load", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    const status = await screen.findByTestId("azure-boards-connection-status");
    expect(within(status).getByText("Setup incomplete")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-boards-test-connection-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-default-behavior-collapsed")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-connection-test-collapsed")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-setup-step-credentials")).toHaveAttribute("data-emphasized", "true");
    expect(within(screen.getByTestId("azure-boards-setup-step-credentials")).getByText("In progress")).toBeInTheDocument();
  });

  it("shows connected state when last stored connection test succeeded", async () => {
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({
        isConfigured: true,
        projectName: "Pilot",
        defaultWorkItemType: "Issue",
        lastConnectionTestUtc: "2026-08-13T12:00:00.000Z",
        lastConnectionTestSummary: "Azure Boards reachable (1 project(s) discovered).",
      }),
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
        updatedUtc: "2026-08-10T12:00:00.000Z",
      }),
    );

    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-token-reference");
    expect(screen.getByTestId("azure-boards-token-reference")).toHaveValue("");
    expect(screen.getByTestId("azure-boards-credential-status")).toHaveTextContent("Secure reference saved");
    expect(screen.queryByText("kv-pat-secret")).not.toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-connection-provenance")).toHaveTextContent(/Last modified/i);
    expect(screen.getByTestId("azure-boards-audit-trail-link")).toHaveAttribute("href", "/governance/audit");
  });

  it("requires token reference before enabling save connection", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    const orgInput = await screen.findByTestId("azure-boards-organization-url");
    fireEvent.change(orgInput, { target: { value: "https://dev.azure.com/example" } });

    expect(screen.getByRole("button", { name: /Save connection/i })).toBeDisabled();
    expect(screen.getByTestId("azure-boards-save-connection-disabled-helper")).toHaveTextContent(
      /token secure reference/i,
    );
  });

  it("preserves typed credentials when refresh is pressed", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    const orgInput = await screen.findByTestId("azure-boards-organization-url");
    const tokenInput = screen.getByTestId("azure-boards-token-reference");
    fireEvent.change(orgInput, { target: { value: "https://dev.azure.com/example" } });
    fireEvent.change(tokenInput, { target: { value: "kv-new-pat" } });

    fireEvent.click(screen.getByTestId("azure-boards-refresh-button"));

    await waitFor(() => {
      expect(screen.getByTestId("azure-boards-organization-url")).toHaveValue("https://dev.azure.com/example");
    });
    expect(screen.getByTestId("azure-boards-token-reference")).toHaveValue("kv-new-pat");
  });

  it("links create-work-items setup step to findings", async () => {
    render(<AzureBoardsIntegrationPageClient />);

    await screen.findByTestId("azure-boards-setup-step-create");
    expect(screen.getByRole("link", { name: /Create work items from findings/i })).toHaveAttribute(
      "href",
      "/governance/findings",
    );
  });

  it("runs connection test with pending and success feedback", async () => {
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
    expect(screen.getByText("Connection check passed")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-integration-aside").innerHTML).not.toMatch(/border-teal-/);
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

  it("shows connection issue when last stored connection test failed", async () => {
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({
        isConfigured: true,
        projectName: "Pilot",
        defaultWorkItemType: "Issue",
        lastConnectionTestUtc: "2026-08-13T12:00:00.000Z",
        lastConnectionTestSummary: "401 unauthorized from _apis/wit",
      }),
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

  it("TB-1760: keeps connection fields when one Promise.all slice fails (TB-1152)", async () => {
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

  it("TB-1760: never shows Database Query Failed as connection status explanation (TB-1153)", async () => {
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
