import { render, screen, waitFor } from "@testing-library/react";

import type { ReactNode } from "react";

import { describe, expect, it, vi } from "vitest";



vi.mock("./AzureConnectionDetailsPanel", () => ({

  AzureConnectionDetailsPanel: () => <div data-testid="azure-connection-details-panel-stub" />,

}));



vi.mock("./AzureConnectionValidatePanel", () => ({

  AzureConnectionValidatePanel: () => <div data-testid="azure-connection-validate-panel" />,

}));



vi.mock("./AzureConnectionRecentActivityPanel", () => ({

  AzureConnectionRecentActivityPanel: () => <div data-testid="azure-connection-recent-activity-panel" />,

}));



vi.mock("./CloudSecurityPreflightPanel", () => ({

  CloudSecurityPreflightPanel: () => <div data-testid="azure-preflight-stub" />,

  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (

    <div data-testid="azure-technical-details-stub">{children}</div>

  ),

}));



vi.mock("@/hooks/use-operate-capability", () => ({

  useOperateCapability: () => true,

}));



vi.mock("@/lib/api/cloud-connections-api", () => ({

  listTier2Connections: vi.fn(async () => []),

  configureTier2Connection: vi.fn(),

  validateTier2ConnectionHostedRun: vi.fn(),

}));



import { AzureCloudConnectionDetailClient } from "./AzureCloudConnectionDetailClient";

import { AZURE_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/azure-cloud-connection-copy";



describe("AzureCloudConnectionDetailClient", () => {

  it("mounts live Validate and Recent activity panels instead of static stubs (TB-1767)", () => {

    render(<AzureCloudConnectionDetailClient />);



    expect(screen.getByTestId("azure-connection-validate-panel")).toBeInTheDocument();

    expect(screen.getByTestId("azure-connection-recent-activity-panel")).toBeInTheDocument();

    expect(screen.queryByText(/Recent collection activity appears after validation/i)).not.toBeInTheDocument();

  });



  it("does not surface Tier/hosted-pull jargon on the Azure product surface (TB-1766)", () => {

    render(<AzureCloudConnectionDetailClient />);



    const detail = screen.getByTestId("cloud-connection-detail-azure");

    const text = detail.textContent ?? "";



    for (const banned of AZURE_CLOUD_CONNECTION_BANNED_COPY) {

      expect(text.toLowerCase()).not.toContain(banned.toLowerCase());

    }

  });



  it("shows connection status and header connect CTA when not connected (P0-1, P0-2)", async () => {

    render(<AzureCloudConnectionDetailClient />);



    await waitFor(() => {

      expect(screen.getByTestId("azure-connection-header-status")).toHaveTextContent("Not connected");

    });



    expect(screen.getByTestId("azure-connection-header-connect")).toHaveTextContent("Connect Azure subscription");

    expect(screen.getByTestId("azure-connection-header-connect")).toHaveAttribute("href", "#connection-details");

  });



  it("does not claim Not connected when the connection list fails to load", async () => {

    const { listTier2Connections } = await import("@/lib/api/cloud-connections-api");

    vi.mocked(listTier2Connections).mockRejectedValueOnce(new Error("network"));



    render(<AzureCloudConnectionDetailClient />);



    await waitFor(() => {

      expect(screen.getByTestId("azure-connection-header-status")).toHaveTextContent("Status unavailable");

    });



    expect(screen.getByTestId("azure-connection-header-status")).not.toHaveTextContent("Not connected");

    expect(screen.queryByTestId("azure-connection-header-connect")).not.toBeInTheDocument();
  });

});
