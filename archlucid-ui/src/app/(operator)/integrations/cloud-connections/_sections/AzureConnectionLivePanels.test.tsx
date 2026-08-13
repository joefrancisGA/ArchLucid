import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AzureConnectionDataProvider } from "./AzureConnectionDataContext";
import { AzureConnectionRecentActivityPanel } from "./AzureConnectionRecentActivityPanel";
import { AzureConnectionValidatePanel } from "./AzureConnectionValidatePanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: vi.fn(async () => [
    {
      connectionId: "conn-1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      clientId: "22222222-2222-2222-2222-222222222222",
      subscriptionIds: "33333333-3333-3333-3333-333333333333",
      updatedUtc: "2026-08-10T12:00:00.000Z",
    },
  ]),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

describe("Azure connection live panels (TB-1767)", () => {
  it("renders live validate and recent activity from connection list", async () => {
    render(
      <AzureConnectionDataProvider>
        <AzureConnectionValidatePanel />
        <AzureConnectionRecentActivityPanel />
      </AzureConnectionDataProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("azure-connection-validate-panel")).toHaveTextContent(
        "11111111-1111-1111-1111-111111111111",
      );
      expect(screen.getByTestId("azure-connection-recent-activity-panel")).toHaveTextContent(
        "11111111-1111-1111-1111-111111111111",
      );
    });

    expect(screen.getByText(/Validate connection in Connection details/i)).toBeInTheDocument();
    expect(screen.queryByText(/Recent collection activity appears after validation/i)).not.toBeInTheDocument();
  });
});
