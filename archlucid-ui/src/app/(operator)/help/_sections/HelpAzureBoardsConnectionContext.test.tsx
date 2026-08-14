import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAzureSettings = vi.fn();
const mockFetchItsmHealth = vi.fn();
const mockFetchConnection = vi.fn();

vi.mock("@/lib/api/azure-boards-api", () => ({
  fetchAzureBoardsSettings: (...args: unknown[]) => mockFetchAzureSettings(...args),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchItsmHealth(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
}));

import { HelpAzureBoardsConnectionContext } from "@/app/(operator)/help/_sections/HelpAzureBoardsConnectionContext";
import { AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION } from "@/lib/azure-boards-integration-present";

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

describe("HelpAzureBoardsConnectionContext", () => {
  beforeEach(() => {
    mockFetchAzureSettings.mockReset();
    mockFetchItsmHealth.mockReset();
    mockFetchConnection.mockReset();
  });

  it("shows sanitized connection status and next step when configuration loads", async () => {
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: true });
    mockFetchAzureSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());

    render(<HelpAzureBoardsConnectionContext />);

    await waitFor(() => {
      expect(screen.getByTestId("help-azure-boards-connection-context")).toBeInTheDocument();
    });

    expect(screen.getByTestId("help-azure-boards-connection-status-tag")).toHaveTextContent("Setup incomplete");
    expect(screen.getByText(/Organization URL and personal access token reference/i)).toBeInTheDocument();
    expect(screen.getByText(/Next step:/i)).toBeInTheDocument();
    expect(screen.queryByText(/database query failed/i)).not.toBeInTheDocument();
  });

  it("shows connected status when last stored connection test succeeded", async () => {
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: true });
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({
        projectName: "Contoso",
        defaultWorkItemType: "Bug",
        isConfigured: true,
        lastConnectionTestUtc: "2026-08-13T12:00:00.000Z",
        lastConnectionTestSummary: "Azure Boards reachable (1 project(s) discovered).",
      }),
    );
    mockFetchConnection.mockResolvedValue(
      baseConnection({
        isConfigured: true,
        instanceBaseUrl: "https://dev.azure.com/contoso",
        credentialKeyVaultSecretName: "kv-secret",
      }),
    );

    render(<HelpAzureBoardsConnectionContext />);

    await waitFor(() => {
      expect(screen.getByTestId("help-azure-boards-connection-status-tag")).toHaveTextContent("Connected");
    });
  });

  it("never surfaces raw API failure text to buyers", async () => {
    mockFetchItsmHealth.mockRejectedValue(new Error("500 Internal Server Error"));
    mockFetchAzureSettings.mockRejectedValue(new Error("programming error"));
    mockFetchConnection.mockRejectedValue(new Error("the database rejected the query"));

    render(<HelpAzureBoardsConnectionContext />);

    await waitFor(() => {
      expect(screen.getByTestId("help-azure-boards-connection-context")).toBeInTheDocument();
    });

    expect(screen.getByTestId("help-azure-boards-connection-status-tag")).toHaveTextContent("Not available");
    expect(screen.getByText(/Azure Boards data could not be loaded/i)).toBeInTheDocument();
    expect(screen.getByText(/Reload the page or contact support/i)).toBeInTheDocument();
    expect(screen.queryByText(/database query failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/programming error/i)).not.toBeInTheDocument();
  });

  it("sanitizes load errors that still return partial slices", async () => {
    mockFetchItsmHealth.mockRejectedValue(new Error("database query failed"));
    mockFetchAzureSettings.mockResolvedValue(baseSettings());
    mockFetchConnection.mockResolvedValue(baseConnection());

    render(<HelpAzureBoardsConnectionContext />);

    await waitFor(() => {
      expect(screen.getByTestId("help-azure-boards-connection-context")).toBeInTheDocument();
    });

    expect(screen.getByText(AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION)).toBeInTheDocument();
    expect(screen.queryByText(/database query failed/i)).not.toBeInTheDocument();
  });
});
