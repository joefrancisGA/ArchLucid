import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./GcpConnectionSection", () => ({
  GcpConnectionSection: () => <div data-testid="gcp-connection-section-stub" />,
}));

vi.mock("./GcpConnectionValidatePanel", () => ({
  GcpConnectionValidatePanel: () => <div data-testid="gcp-connection-validate-panel" />,
}));

vi.mock("./GcpConnectionRecentActivityPanel", () => ({
  GcpConnectionRecentActivityPanel: () => <div data-testid="gcp-connection-recent-activity-panel" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="gcp-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="gcp-technical-details-stub">{children}</div>
  ),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: vi.fn(async () => []),
  configureGcpTier2Connection: vi.fn(),
  disconnectGcpTier2Connection: vi.fn(),
  triggerGcpTier2HostedRun: vi.fn(),
}));

import { GcpCloudConnectionDetailClient } from "./GcpCloudConnectionDetailClient";
import { GCP_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/gcp-cloud-connection-copy";

describe("GcpCloudConnectionDetailClient", () => {
  it("does not claim Preview for Tier 2 Done GCP (TB-1140)", () => {
    render(<GcpCloudConnectionDetailClient />);

    const detail = screen.getByTestId("cloud-connection-detail-gcp");

    expect(detail).toBeInTheDocument();
    expect(detail).not.toHaveTextContent(/Preview/i);
    expect(detail).toHaveTextContent(/Workload Identity Federation/i);
    expect(screen.queryByTestId("cloud-connection-gcp-orientation")).toBeNull(); // TB-2092
  });

  it("does not surface Tier/hosted-poll jargon on the GCP product surface (TB-1774)", () => {
    render(<GcpCloudConnectionDetailClient />);

    const detail = screen.getByTestId("cloud-connection-detail-gcp");
    const text = detail.textContent ?? "";

    for (const banned of GCP_CLOUD_CONNECTION_BANNED_COPY) {
      expect(text.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it("exposes federation identifiers and a copyable WIF pool-provider starter (TB-1775)", () => {
    render(<GcpCloudConnectionDetailClient />);

    expect(screen.getByTestId("gcp-wif-starter-panel")).toBeInTheDocument();
    expect(screen.getByTestId("gcp-wif-starter-federation-identifiers")).toBeInTheDocument();
    expect(screen.getByText("api://AzureADTokenExchange")).toBeInTheDocument();

    const scriptTemplate = screen.getByTestId("gcp-wif-starter-script-template");
    expect(scriptTemplate).toHaveTextContent("workload-identity-pools providers create-oidc");
    expect(scriptTemplate).toHaveTextContent("YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID");
    expect(screen.getByTestId("gcp-wif-starter-script-copy")).toBeInTheDocument();
  });

  it("mounts live Validate and Recent activity panels instead of static stubs (TB-1773)", () => {
    render(<GcpCloudConnectionDetailClient />);

    expect(screen.getByTestId("gcp-connection-validate-panel")).toBeInTheDocument();
    expect(screen.getByTestId("gcp-connection-recent-activity-panel")).toBeInTheDocument();
  });

  it("shows connection status and header connect CTA when not connected (P0-2)", async () => {
    render(<GcpCloudConnectionDetailClient />);

    await waitFor(() => {
      expect(screen.getByTestId("gcp-connection-header-status")).toHaveTextContent("Not connected");
    });

    expect(screen.getByTestId("gcp-connection-header-connect")).toHaveTextContent("Connect GCP project");
    expect(screen.getByTestId("gcp-connection-header-connect")).toHaveAttribute("href", "#connection-details");
  });
});
