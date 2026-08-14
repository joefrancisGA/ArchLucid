import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
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
import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";
import { CLOUD_CONNECTIONS_SOURCES } from "@/lib/cloud-connections-evidence-copy";

import { CloudConnectionsPageClient } from "./CloudConnectionsPageClient";

describe("CloudConnectionsPageClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    window.localStorage.clear();
    resetCloudPlatformScopeSessionStateForTests();
  });

  it("renders cloud-neutral landing cards without inline provider setup forms", async () => {
    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-evidence-only")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1, name: "Cloud connections" })).toBeInTheDocument();
    expect(screen.getByText(/Cloud connectors are optional/i)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-platform-scope-panel")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-aws")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-azure")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-gcp")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-gcp")).not.toHaveTextContent(/Preview/i);
    expect(screen.queryByTestId("tier2-connection-wizard")).not.toBeInTheDocument();
    expect(screen.queryByTestId("aws-account-id")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gcp-project-id")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-aws").querySelector('a[href="/integrations/cloud-connections/aws"]')).toBeTruthy();
    expect(screen.queryByTestId("connection-status-cloud-connections-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("extract-upload-cloud-connections-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-hub-vocabulary-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connections-security-assurance-band")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach")).toBeInTheDocument();

    for (const provider of ["aws", "azure", "gcp"] as const) {
      const card = screen.getByTestId(`cloud-connection-card-${provider}`);
      expect(screen.getByTestId(`cloud-connection-card-${provider}-primary-cta`)).toHaveTextContent("Configure");
      expect(card.querySelectorAll("a[href^='/integrations/cloud-connections/']")).toHaveLength(1);
      expect(card).not.toHaveTextContent("View details");
      expect(screen.getByTestId(`cloud-connection-card-${provider}-not-connected`)).toBeInTheDocument();
      expect(card).not.toHaveTextContent("Not configured");
      expect(card).not.toHaveTextContent("Not validated yet");
      expect(card).not.toHaveTextContent("No packages collected");
    }
  });

  it("renders the cloud connections Sources and claim-discipline strip", async () => {
    render(<CloudConnectionsPageClient />);

    await screen.findByTestId("cloud-connections-orientation");

    const sources = screen.getByTestId("cloud-connections-sources");

    for (const link of CLOUD_CONNECTIONS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(screen.queryByTestId("cloud-connections-claim-discipline")).not.toBeInTheDocument();
  });

  it("suppresses zero-theater rows on unconfigured provider cards (TB-1143)", async () => {
    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-aws-not-connected")).toBeInTheDocument();
    });

    expect(screen.getByTestId("cloud-connection-card-evidence-only")).toHaveTextContent("Always available");
    expect(screen.queryByText("Not configured")).not.toBeInTheDocument();
    expect(screen.queryByText("Not validated yet")).not.toBeInTheDocument();
    expect(screen.queryByText("No packages collected")).not.toBeInTheDocument();
  });

  it("shows zero-connected readiness coach with one recommended action", async () => {
    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach")).toBeInTheDocument();
    });

    expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveAttribute("data-phase", "empty");
    expect(screen.getByText(/0 of 3 cloud providers connected/i)).toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveTextContent("Configure AWS");
    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/aws",
    );
  });

  it("hides provider cards when platform scope is narrowed", async () => {
    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Pilot workspace",
        projectLabel: "Default",
      }),
    );

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-azure")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cloud-platform-scope-azure"));
    fireEvent.click(screen.getByTestId("cloud-platform-scope-gcp"));

    expect(screen.queryByTestId("cloud-connection-card-azure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cloud-connection-card-gcp")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-aws")).toBeInTheDocument();
  });

  it("recommends a visible provider when AWS is hidden from platform scope", async () => {
    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Pilot workspace",
        projectLabel: "Default",
      }),
    );

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-first-inventory-coach")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cloud-platform-scope-aws"));

    expect(screen.queryByTestId("cloud-connection-card-aws")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveTextContent("Configure Azure");
    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections/azure",
    );
  });

  it("uses Open connection as the sole primary CTA when a provider is configured (TB-1141)", async () => {
    listAwsTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "aws-1",
        status: "Configured",
        updatedUtc: "2026-07-01T00:00:00Z",
        lastPolledUtc: "2026-07-01T00:00:00Z",
      },
    ]);

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-aws-primary-cta")).toHaveTextContent("Open connection");
    });

    const awsCard = screen.getByTestId("cloud-connection-card-aws");
    expect(awsCard.querySelectorAll("a[href='/integrations/cloud-connections/aws']")).toHaveLength(1);
    expect(awsCard).not.toHaveTextContent("View details");
    expect(screen.queryByTestId("cloud-connection-card-aws-not-connected")).not.toBeInTheDocument();
    expect(awsCard).toHaveTextContent("Last validation");
    expect(awsCard).toHaveTextContent("Evidence collected");
    expect(screen.getByTestId("cloud-connection-card-azure-primary-cta")).toHaveTextContent("Configure");
    expect(screen.getByTestId("cloud-connection-card-azure-not-connected")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveAttribute("data-phase", "post-pull");
  });

  it("stays post-connect when AWS is configured without a successful pull", async () => {
    listAwsTier2Connections.mockResolvedValueOnce([
      {
        connectionId: "aws-1",
        status: "Configured",
        updatedUtc: "2026-07-01T00:00:00Z",
        lastPolledUtc: null,
      },
    ]);

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-aws-primary-cta")).toHaveTextContent("Open connection");
    });

    expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveAttribute("data-phase", "post-connect");
  });

  it("disables platform scope and keeps all cards when effective scope is missing (TB-1142)", async () => {
    vi.spyOn(operatorScopeStorage, "getEffectiveBrowserProxyScopeHeaders").mockReturnValue({
      "x-tenant-id": "",
      "x-workspace-id": "",
      "x-project-id": "",
    });

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-gcp")).toBeInTheDocument();
    });

    expect(screen.getByTestId("cloud-platform-scope-workspace-required")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-platform-scope-workspace-action")).toHaveAttribute("href", "/help/scope");
    expect(screen.getByTestId("cloud-platform-scope-gcp")).toBeDisabled();

    fireEvent.click(screen.getByTestId("cloud-platform-scope-gcp"));

    expect(screen.getByTestId("cloud-connection-card-gcp")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-aws")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-card-azure")).toBeInTheDocument();
  });

  it("keeps panel and cards on the same scope when a workspace is present (TB-1142)", async () => {
    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Pilot workspace",
        projectLabel: "Default",
      }),
    );

    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("cloud-connection-card-azure")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("cloud-platform-scope-workspace-required")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-platform-scope-azure")).not.toBeDisabled();

    fireEvent.click(screen.getByTestId("cloud-platform-scope-azure"));

    expect(screen.queryByTestId("cloud-connection-card-azure")).not.toBeInTheDocument();
    expect(screen.getByTestId("cloud-platform-scope-azure")).not.toBeChecked();
  });
});
