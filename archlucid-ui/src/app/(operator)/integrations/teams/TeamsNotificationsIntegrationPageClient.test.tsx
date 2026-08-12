import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => (
    <button type="button" data-testid="page-contextual-help-button">
      Microsoft Teams notification help
    </button>
  ),
}));

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
import { TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import {
  TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER,
  TEAMS_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_PAGE_TITLE,
  TEAMS_INTEGRATION_SECRET_NAME_LABEL,
  TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE,
} from "@/lib/teams-integration-page-copy";
import { TEAMS_RECOMMENDED_EVENT_TYPES } from "@/lib/teams-integration-notification-catalog";
import { showSuccess } from "@/lib/toast";

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
    expect(await screen.findByTestId("teams-connection-status")).toContainElement(
      screen.getByLabelText("Status: Not configured"),
    );
    expect(screen.getByTestId("teams-not-configured-next-step")).toHaveTextContent(
      TEAMS_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
    );
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(
      "Microsoft Teams notification help",
    );
    expect(screen.queryByRole("link", { name: /^Microsoft Teams notification help$/i })).not.toBeInTheDocument();
    expect(screen.queryAllByRole("link", { name: /^Slack notifications$/i })).toHaveLength(0);
  });

  it("does not pre-check recommended triggers when not configured (TB-1175)", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    expect(await screen.findByTestId("teams-draft-not-saved")).toHaveTextContent(
      TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER,
    );

    const secretInput = screen.getByLabelText(TEAMS_INTEGRATION_SECRET_NAME_LABEL);
    expect(secretInput).toHaveValue("");
    expect(secretInput).toHaveAttribute("placeholder", "teams-governance-alerts-prod");

    for (const eventType of TEAMS_RECOMMENDED_EVENT_TYPES) {
      const checkboxId = `teams-trigger-${eventType.replace(/\./g, "-")}`;
      const checkbox = document.getElementById(checkboxId);
      expect(checkbox).not.toBeNull();
      expect(checkbox).not.toBeChecked();
    }
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

  it("validates a secret name and sends a test notification", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    const secretInput = await screen.findByLabelText(TEAMS_INTEGRATION_SECRET_NAME_LABEL);
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

    expect(await screen.findByTestId("teams-form-test-feedback")).toHaveTextContent(
      "Test notification sent to Microsoft Teams.",
    );
  });

  it("TB-1176: not-configured path promotes Validate, demotes Save, and explains disabled Test", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    const secretInput = await screen.findByLabelText(TEAMS_INTEGRATION_SECRET_NAME_LABEL);
    fireEvent.change(secretInput, { target: { value: "teams-governance-alerts-prod" } });

    expect(screen.getByTestId("teams-validate-button")).toHaveClass("bg-[var(--al-primary-action-bg)]");
    expect(screen.getByTestId("teams-save-button")).not.toHaveClass("bg-[var(--al-primary-action-bg)]");
    expect(screen.getByTestId("teams-test-button")).toBeDisabled();
    expect(screen.getByTestId("teams-test-disabled-helper")).toHaveTextContent(
      "Validate the secret before sending a test.",
    );
    expect(screen.getByTestId("teams-save-button")).toBeDisabled();
  });

  it("TB-1177: uses operator spacing tokens instead of marketing-scale py-8 / space-y-8", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    const page = await screen.findByTestId("integrations-teams-page");
    expect(page.className).toContain("space-y-6");
    expect(page.className).toContain("py-4");
    expect(page.className).not.toContain("space-y-8");
    expect(page.className).not.toContain("py-8");
  });

  it("rejects a webhook URL pasted into the secret name field", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{ mode: "live", conn: null, catalog: CATALOG, failure: null }}
      />,
    );

    const secretInput = await screen.findByLabelText(TEAMS_INTEGRATION_SECRET_NAME_LABEL);
    fireEvent.change(secretInput, {
      target: { value: "https://webhook.office.com/webhookb2/secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate secret" }));

    expect(await screen.findByText(TEAMS_INTEGRATION_SECRET_NAME_NOT_URL_MESSAGE)).toBeInTheDocument();
    expect(mockValidate).not.toHaveBeenCalled();
  });

  it("shows durable success callout after saving a Teams connection", async () => {
    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{
          mode: "live",
          conn: {
            tenantId: "t",
            isConfigured: true,
            label: "Ops channel",
            keyVaultSecretName: "teams-ops",
            enabledTriggers: [...TEAMS_RECOMMENDED_EVENT_TYPES],
            updatedUtc: "2026-01-01T00:00:00Z",
          },
          catalog: CATALOG,
          failure: null,
        }}
      />,
    );

    fireEvent.click(await screen.findByTestId("teams-save-button"));

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("teams-integration-mutation-success-callout")).toHaveTextContent(
      TEAMS_INTEGRATION_SAVE_SUCCESS_MESSAGE,
    );
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("confirms before removing a Teams connection instead of window.confirm", async () => {
    mockGetConnection.mockResolvedValue({
      tenantId: "t",
      isConfigured: true,
      label: "Ops channel",
      keyVaultSecretName: "teams-ops",
      enabledTriggers: TEAMS_RECOMMENDED_EVENT_TYPES,
      updatedUtc: "2026-01-01T00:00:00Z",
    });
    mockDelete.mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, "confirm");

    render(
      <TeamsNotificationsIntegrationPageClient
        loaded={{
          mode: "live",
          conn: {
            tenantId: "t",
            isConfigured: true,
            label: "Ops channel",
            keyVaultSecretName: "teams-ops",
            enabledTriggers: [...TEAMS_RECOMMENDED_EVENT_TYPES],
            updatedUtc: "2026-01-01T00:00:00Z",
          },
          catalog: CATALOG,
          failure: null,
        }}
      />,
    );

    fireEvent.click(await screen.findByTestId("teams-remove-connection"));

    expect(screen.getByRole("heading", { name: /Remove Teams connection/i })).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove connection" }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
