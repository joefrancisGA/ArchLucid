import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

const listTier2Connections = vi.fn(async () => []);
const listAwsTier2Connections = vi.fn(async () => []);
const listGcpTier2Connections = vi.fn(async () => []);

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: (...args: unknown[]) => listTier2Connections(...args),
  configureTier2Connection: vi.fn(),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

vi.mock("@/lib/api/aws-cloud-connections-api", () => ({
  listAwsTier2Connections: (...args: unknown[]) => listAwsTier2Connections(...args),
  configureAwsTier2Connection: vi.fn(),
  disconnectAwsTier2Connection: vi.fn(),
  triggerAwsTier2HostedRun: vi.fn(),
}));

vi.mock("@/lib/api/gcp-cloud-connections-api", () => ({
  listGcpTier2Connections: (...args: unknown[]) => listGcpTier2Connections(...args),
  configureGcpTier2Connection: vi.fn(),
  disconnectGcpTier2Connection: vi.fn(),
  triggerGcpTier2HostedRun: vi.fn(),
}));

import { resetCloudPlatformScopeSessionStateForTests } from "@/lib/cloud-platform-scope-storage";

import { CloudConnectionsPageClient } from "./CloudConnectionsPageClient";

describe("CloudConnectionsPageClient (SecureNow collection missing)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    resetCloudPlatformScopeSessionStateForTests();
  });

  it("names subscription scope on the collection-missing block when Azure has no successful pull", async () => {
    listTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "azure-1",
        subscriptionIds: "33333333-3333-3333-3333-333333333333",
        updatedUtc: null,
      },
    ]);

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("securenow-collection-missing")).toBeInTheDocument();
    });

    expect(screen.getByTestId("cloud-connections-collection-missing-subscription-scope")).toHaveTextContent(
      "Subscription scope: 33333333-3333-3333-3333-333333333333.",
    );
    expect(screen.getByTestId("cloud-connections-collection-missing-detail")).toHaveTextContent(
      /capture failed or has not finished/i,
    );
    expect(screen.getByTestId("cloud-connections-collection-setup-checklist")).toBeInTheDocument();

    expect(screen.getByTestId("cloud-connections-collection-missing-first-hour-link")).toHaveAttribute(
      "href",
      "/administration/securenow-first-hour",
    );
    expect(screen.getByTestId("cloud-connections-collection-missing-collection-check-link")).toHaveAttribute(
      "href",
      "/administration/securenow-self-service#collection",
    );
  });

  it("shows collection ready when capture succeeded and setup is complete", async () => {
    listTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "azure-1",
        subscriptionIds: "33333333-3333-3333-3333-333333333333",
        updatedUtc: "2026-01-02T00:00:00Z",
      },
    ]);

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connections-collection-ready")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("securenow-collection-missing")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-collection-ready-path-inspect-link")).toHaveAttribute(
      "href",
      "/security/remediation-factory",
    );
  });
});
