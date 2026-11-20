import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 100,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),
}));

vi.mock("./Tier2ConnectionWizard", () => ({
  Tier2ConnectionWizard: () => <div data-testid="tier2-connection-wizard-stub" />,
}));

const listTier2Connections = vi.fn(async () => []);

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: (...args: unknown[]) => listTier2Connections(...args),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

import { AzureConnectionDataProvider } from "./AzureConnectionDataContext";
import { AzureConnectionDetailsPanel } from "./AzureConnectionDetailsPanel";

describe("AzureConnectionDetailsPanel", () => {
  beforeEach(() => {
    listTier2Connections.mockReset();
    listTier2Connections.mockResolvedValue([]);
  });

  it("TB-1769: hydrates connected summary with a single primary validate CTA", async () => {
    listTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "azure-conn-1",
        tenantId: "tenant-guid",
        clientId: "client-guid",
        subscriptionIds: "sub-guid",
        updatedUtc: "2026-08-10T12:00:00.000Z",
      },
    ]);

    render(
      <AzureConnectionDataProvider>
        <AzureConnectionDetailsPanel />
      </AzureConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("azure-connected-connection-summary")).toBeInTheDocument();
    });

    expect(screen.getByTestId("azure-revalidate-azure-conn-1")).toBeInTheDocument();
    expect(screen.queryByTestId("tier2-connection-wizard-stub")).not.toBeInTheDocument();
  });

  it("TB-1769: update connection opens the wizard for editing", async () => {
    listTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "azure-conn-1",
        tenantId: "tenant-guid",
        clientId: "client-guid",
        subscriptionIds: "sub-guid",
        updatedUtc: "2026-08-10T12:00:00.000Z",
      },
    ]);

    render(
      <AzureConnectionDataProvider>
        <AzureConnectionDetailsPanel />
      </AzureConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("azure-update-connection")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("azure-update-connection"));

    expect(screen.getByTestId("tier2-connection-wizard-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("azure-connected-connection-summary")).not.toBeInTheDocument();
  });

  it("keeps a failed retry recoverable and prevents repeated clicks while it runs", async () => {
    let rejectRetry: (reason: Error) => void = () => {};
    const retryRequest = new Promise<never>((_, reject) => {
      rejectRetry = reject;
    });
    listTier2Connections
      .mockRejectedValueOnce(new Error("initial request failed"))
      .mockReturnValueOnce(retryRequest);

    render(
      <AzureConnectionDataProvider>
        <AzureConnectionDetailsPanel />
      </AzureConnectionDataProvider>,
    );

    const retry = await screen.findByTestId("azure-connection-details-load-error-retry");
    fireEvent.click(retry);
    expect(retry).toBeDisabled();
    expect(retry).toHaveTextContent("Retrying");
    fireEvent.click(retry);
    expect(listTier2Connections).toHaveBeenCalledTimes(2);

    rejectRetry(new Error("retry request failed"));
    await waitFor(() => expect(retry).toBeEnabled());
    expect(screen.getByTestId("azure-connection-details-load-error")).toBeInTheDocument();

    fireEvent.click(retry);
    expect(await screen.findByTestId("tier2-connection-wizard-stub")).toBeInTheDocument();
    expect(listTier2Connections).toHaveBeenCalledTimes(3);
  });
});
