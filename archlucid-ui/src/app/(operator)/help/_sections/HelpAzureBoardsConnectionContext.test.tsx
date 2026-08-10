import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchAzureHealth = vi.fn();
const mockFetchAzureSettings = vi.fn();
const mockFetchItsmHealth = vi.fn();
const mockFetchConnection = vi.fn();

vi.mock("@/lib/api/azure-boards-api", () => ({
  fetchAzureBoardsHealth: (...args: unknown[]) => mockFetchAzureHealth(...args),
  fetchAzureBoardsSettings: (...args: unknown[]) => mockFetchAzureSettings(...args),
}));

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  fetchItsmIntegrationHealth: (...args: unknown[]) => mockFetchItsmHealth(...args),
  fetchTenantItsmConnectorConnection: (...args: unknown[]) => mockFetchConnection(...args),
}));

import { HelpAzureBoardsConnectionContext } from "@/app/(operator)/help/_sections/HelpAzureBoardsConnectionContext";
import { AZURE_BOARDS_LOAD_FAILURE_STATUS_EXPLANATION } from "@/lib/azure-boards-integration-present";

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

describe("HelpAzureBoardsConnectionContext", () => {
  beforeEach(() => {
    mockFetchAzureHealth.mockReset();
    mockFetchAzureSettings.mockReset();
    mockFetchItsmHealth.mockReset();
    mockFetchConnection.mockReset();
  });

  it("shows sanitized connection status and next step when configuration loads", async () => {
    mockFetchAzureHealth.mockResolvedValue(baseHealth());
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

  it("shows connected status when health probe succeeds", async () => {
    mockFetchAzureHealth.mockResolvedValue(baseHealth({ reachable: true, status: "ok" }));
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: true });
    mockFetchAzureSettings.mockResolvedValue(
      baseSettings({ projectName: "Contoso", defaultWorkItemType: "Bug", isConfigured: true }),
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
    mockFetchAzureHealth.mockRejectedValue(new Error("database query failed: syntax error"));
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
    mockFetchAzureHealth.mockRejectedValue(new Error("database query failed"));
    mockFetchItsmHealth.mockResolvedValue({ nativeEnabled: true });
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
