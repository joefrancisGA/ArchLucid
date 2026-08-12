import { render, screen } from "@testing-library/react";
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
});
