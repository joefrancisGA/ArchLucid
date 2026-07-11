import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetConnection = vi.fn();
const mockGetCatalog = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockValidate = vi.fn();
const mockTest = vi.fn();

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api", () => ({
  getTeamsIncomingWebhookConnection: (...args: unknown[]) => mockGetConnection(...args),
  getTeamsNotificationTriggerCatalog: (...args: unknown[]) => mockGetCatalog(...args),
  upsertTeamsIncomingWebhookConnection: (...args: unknown[]) => mockUpsert(...args),
  deleteTeamsIncomingWebhookConnection: (...args: unknown[]) => mockDelete(...args),
  validateTeamsIncomingWebhookSecret: (...args: unknown[]) => mockValidate(...args),
  testTeamsIncomingWebhookConnection: (...args: unknown[]) => mockTest(...args),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { TeamsNotificationsIntegrationPageClient } from "@/app/(operator)/integrations/teams/_sections/TeamsNotificationsIntegrationPageClient";
import {
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_PAGE_TITLE,
} from "@/lib/teams-integration-page-copy";

const CATALOG = [
  "com.archlucid.authority.run.completed",
  "com.archlucid.governance.approval.submitted",
  "com.archlucid.alert.fired",
  "com.archlucid.compliance.drift.escalated",
  "com.archlucid.advisory.scan.completed",
  "com.archlucid.seat.reservation.released",
];

const BANNED_PATTERNS = [
  /Service Bus/i,
  /Logic Apps/i,
  /integration-event fan-out/i,
  /operator UI/i,
  /com\.archlucid\./,
  /Save reference/i,
  /Remove reference/i,
];

describe("TeamsNotificationsIntegrationPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCatalog.mockResolvedValue(CATALOG);
    mockGetConnection.mockResolvedValue({
      tenantId: "t",
      isConfigured: false,
      label: null,
      keyVaultSecretName: null,
      enabledTriggers: CATALOG,
      updatedUtc: "2026-01-01T00:00:00Z",
    });
    mockValidate.mockResolvedValue({ outcome: "Found", message: "Secret found and accessible." });
    mockTest.mockResolvedValue({ delivered: true, message: "Test notification sent to Microsoft Teams." });
    mockUpsert.mockResolvedValue({
      tenantId: "t",
      isConfigured: true,
      label: "Architecture governance",
      keyVaultSecretName: "teams-governance-alerts-prod",
      enabledTriggers: [
        "com.archlucid.authority.run.completed",
        "com.archlucid.governance.approval.submitted",
        "com.archlucid.alert.fired",
      ],
      updatedUtc: "2026-01-02T00:00:00Z",
    });
  });

  it("shows customer-facing title, subtitle, and status", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: TEAMS_INTEGRATION_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(TEAMS_INTEGRATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(await screen.findByTestId("teams-connection-status")).toHaveTextContent("Not configured");
  });

  it("does not expose internal architecture terminology", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    await screen.findByTestId("integrations-teams-page");

    const pageText = document.body.textContent ?? "";

    for (const pattern of BANNED_PATTERNS) {
      expect(pageText).not.toMatch(pattern);
    }
  });

  it("renders grouped notification labels instead of raw event identifiers", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    expect(await screen.findByText("Review completed")).toBeInTheDocument();
    expect(screen.getByText("Approval requested")).toBeInTheDocument();
    expect(screen.getByText("Governance alert created")).toBeInTheDocument();
    expect(screen.queryByText("com.archlucid.authority.run.completed")).not.toBeInTheDocument();
  });

  it("validates a Key Vault secret name and sends a test notification", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    const secretInput = await screen.findByLabelText("Key Vault secret name");
    fireEvent.change(secretInput, { target: { value: "teams-governance-alerts-prod" } });
    fireEvent.click(screen.getByRole("button", { name: "Validate secret" }));

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith("teams-governance-alerts-prod");
    });

    expect(await screen.findByTestId("teams-secret-validation-feedback")).toHaveTextContent(
      "Secret found and accessible.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Send test notification" }));

    await waitFor(() => {
      expect(mockTest).toHaveBeenCalledWith("teams-governance-alerts-prod");
    });

    expect(await screen.findByTestId("teams-test-feedback")).toHaveTextContent(
      "Test notification sent to Microsoft Teams.",
    );
  });

  it("rejects webhook URLs in the secret name field", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    const secretInput = await screen.findByLabelText("Key Vault secret name");
    fireEvent.change(secretInput, {
      target: { value: "https://webhook.office.com/webhookb2/secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate secret" }));

    expect(await screen.findByText("Enter a Key Vault secret name, not a webhook URL.")).toBeInTheDocument();
    expect(mockValidate).not.toHaveBeenCalled();
  });
});
