import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockToggle = vi.fn();
const mockTest = vi.fn();
const mockDryRun = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/integrations/slack",
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: (...args: unknown[]) => mockList(...args),
  createAlertRoutingSubscription: (...args: unknown[]) => mockCreate(...args),
  toggleAlertRoutingSubscription: (...args: unknown[]) => mockToggle(...args),
  testWebhookSubscription: (...args: unknown[]) => mockTest(...args),
  dryRunOutboundWebhook: (...args: unknown[]) => mockDryRun(...args),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SlackIntegrationPageClient } from "@/app/(operator)/integrations/slack/_sections/SlackIntegrationPageClient";
import {
  SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import {
  SLACK_ACTION_REFRESH,
  SLACK_FIELD_DESTINATION_NAME_LABEL,
  SLACK_FIELD_WEBHOOK_URL_LABEL,
  SLACK_INTEGRATION_EMPTY_DESCRIPTION,
  SLACK_INTEGRATION_EMPTY_TITLE,
  SLACK_INTEGRATION_PAGE_SUBTITLE,
  SLACK_INTEGRATION_PAGE_TITLE,
  SLACK_LAST_CHECKED_PREFIX,
} from "@/lib/slack-integration-page-copy";
import { showSuccess } from "@/lib/toast";

describe("SlackIntegrationPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({});
    mockToggle.mockResolvedValue({});
    mockTest.mockResolvedValue({ transportSucceeded: true, statusCode: 200, responseBodyTruncated: false });
    mockDryRun.mockResolvedValue({ transportSucceeded: true, statusCode: 200, responseBodyTruncated: false });
  });

  it("shows OperatorPageHeader with breadcrumb, status badge, refresh, and last checked", async () => {
    render(<SlackIntegrationPageClient />);

    expect(screen.getByRole("heading", { level: 1, name: SLACK_INTEGRATION_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SLACK_INTEGRATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("slack-page-breadcrumb")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("slack-header-status-badge")).toHaveTextContent("Not configured");
    });
    expect(screen.getByTestId("slack-refresh-button")).toHaveTextContent(SLACK_ACTION_REFRESH);
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("How Slack notifications work");

    await waitFor(() => {
      expect(screen.getByTestId("slack-last-checked")).toBeInTheDocument();
    });
    expect(screen.getByTestId("slack-last-checked")).toHaveTextContent(SLACK_LAST_CHECKED_PREFIX);
    expect(screen.getByTestId("slack-last-checked").querySelector("time")).toBeInTheDocument();

    const readinessLinks = screen.getAllByRole("link", { name: /^Integration readiness$/i });
    expect(readinessLinks).toHaveLength(1);
    expect(readinessLinks[0]).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
    expect(screen.queryByRole("link", { name: /Configure Microsoft Teams/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Need a different channel\?/i)).not.toBeInTheDocument();

    const pageRoot = screen.getByTestId("integrations-slack-page");
    expect(pageRoot.className).not.toMatch(/\bspace-y-8\b/);
    expect(pageRoot.className).not.toMatch(/\bpy-8\b/);
    expect(pageRoot.className).toMatch(/\bpy-4\b/);
  });

  it("mounts one channel-disambiguation vocabulary rail", async () => {
    render(<SlackIntegrationPageClient />);

    await screen.findByTestId("integrations-slack-page");

    expect(screen.getByTestId("digests-teams-slack-vocabulary")).toBeInTheDocument();
    expect(screen.queryByTestId("teams-slack-notification-vocabulary")).not.toBeInTheDocument();
  });

  it("stacks setup guidance below the connect form (TB-1575 / TB-1576 demoted single-column)", async () => {
    render(<SlackIntegrationPageClient />);
    await screen.findByTestId("integrations-slack-page");

    const layout = screen.getByTestId("slack-page-layout");
    expect(layout.className).not.toContain("lg:grid-cols-[minmax(0,1fr)_17.5rem]");
    expect(screen.getByTestId("slack-integration-aside").className).not.toContain("lg:sticky");
    expect(screen.getByTestId("slack-setup-progress")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Security$/i })).not.toBeInTheDocument();
  });

  it("renders customer-facing form labels and Test-before-Save CTA hierarchy", async () => {
    render(<SlackIntegrationPageClient />);

    expect(await screen.findByRole("heading", { name: "Add Slack destination" })).toBeInTheDocument();
    expect(screen.getByLabelText(`${SLACK_FIELD_DESTINATION_NAME_LABEL} (required)`)).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum alert severity")).toBeInTheDocument();
    expect(screen.getByLabelText(`${SLACK_FIELD_WEBHOOK_URL_LABEL} (required)`)).toBeInTheDocument();
    expect(screen.getByLabelText("Signing secret (optional)")).toBeInTheDocument();
    expect(screen.queryByText(/cannot be displayed again after the destination is saved/i)).not.toBeInTheDocument();

    const testButton = screen.getByTestId("slack-test-button");
    const saveButton = screen.getByTestId("slack-save-button");

    expect(testButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(screen.getByTestId("slack-save-disabled-helper")).toHaveTextContent(
      /Send a successful test notification before saving/i,
    );
    expect(testButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows polished empty state for destinations without duplicate zero-state copy", async () => {
    render(<SlackIntegrationPageClient />);

    expect(await screen.findByTestId("slack-destinations-empty-state")).toHaveTextContent(SLACK_INTEGRATION_EMPTY_TITLE);
    expect(screen.queryByText("No destinations in this workspace yet.")).not.toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(SLACK_INTEGRATION_EMPTY_TITLE, "i"))).toHaveLength(1);
    expect(screen.getAllByText(new RegExp(SLACK_INTEGRATION_EMPTY_DESCRIPTION, "i"))).toHaveLength(1);
  });

  it("shows visible refresh label on destinations panel", async () => {
    render(<SlackIntegrationPageClient />);

    const refreshButton = await screen.findByTestId("slack-destinations-refresh");
    expect(refreshButton).toHaveTextContent("Refresh");
  });

  it("sends a dry-run test notification from the form", async () => {
    render(<SlackIntegrationPageClient />);

    const nameInput = await screen.findByLabelText(`${SLACK_FIELD_DESTINATION_NAME_LABEL} (required)`);
    const webhookInput = screen.getByLabelText(`${SLACK_FIELD_WEBHOOK_URL_LABEL} (required)`);

    fireEvent.change(nameInput, {
      target: { value: "Governance alerts" },
    });
    fireEvent.blur(nameInput);
    fireEvent.change(webhookInput, {
      target: { value: "https://hooks.slack.com/services/T000/B000/XXXXXXXX" },
    });
    fireEvent.blur(webhookInput);
    fireEvent.click(screen.getByRole("button", { name: "Send test notification" }));

    await waitFor(() => {
      expect(mockDryRun).toHaveBeenCalledWith({
        targetUrl: "https://hooks.slack.com/services/T000/B000/XXXXXXXX",
        sharedSecret: null,
      });
    });

    expect(await screen.findByTestId("slack-form-test-feedback")).toHaveTextContent(
      "Test notification sent successfully.",
    );
  });

  it("shows durable success callout after testing then saving a destination", async () => {
    render(<SlackIntegrationPageClient />);

    fireEvent.change(await screen.findByLabelText(`${SLACK_FIELD_DESTINATION_NAME_LABEL} (required)`), {
      target: { value: "Governance alerts" },
    });
    fireEvent.blur(screen.getByLabelText(`${SLACK_FIELD_DESTINATION_NAME_LABEL} (required)`));
    fireEvent.change(screen.getByLabelText(`${SLACK_FIELD_WEBHOOK_URL_LABEL} (required)`), {
      target: { value: "https://hooks.slack.com/services/T000/B000/XXXXXXXX" },
    });
    fireEvent.blur(screen.getByLabelText(`${SLACK_FIELD_WEBHOOK_URL_LABEL} (required)`));

    expect(screen.getByTestId("slack-save-button")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Send test notification" }));

    expect(await screen.findByTestId("slack-form-test-feedback")).toHaveTextContent(
      "Test notification sent successfully.",
    );
    expect(screen.getByTestId("slack-save-button")).not.toBeDisabled();
    expect(screen.queryByTestId("slack-save-disabled-helper")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save destination" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("slack-integration-mutation-success-callout")).toHaveTextContent(
      SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
    );
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it("lists existing destinations without exposing webhook URLs in the table", async () => {
    mockList.mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Governance alerts",
        channelType: "SlackWebhook",
        destination: "https://hooks.slack.com/services/SECRET/PATH",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        lastDeliveredUtc: "2026-01-02T00:00:00Z",
        metadataJson: JSON.stringify({ eventTypes: ["archlucid.alert.recorded"] }),
      },
    ]);

    render(<SlackIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("slack-header-status-badge")).toHaveTextContent("1 active destination");
    });
    const table = await screen.findByTestId("slack-destinations-table");
    expect(within(table).getByText("Governance alerts")).toBeInTheDocument();
    expect(screen.queryByText("https://hooks.slack.com/services/SECRET/PATH")).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Slack notification destinations" })).toBe(table);
    expect(screen.getByText("1 destination in this workspace.")).toBeInTheDocument();
  });

  it("uses EnterpriseTable inventory for populated Slack destinations (TB-1648)", async () => {
    mockList.mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Governance alerts",
        channelType: "SlackWebhook",
        destination: "https://hooks.slack.com/services/SECRET/PATH",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        lastDeliveredUtc: "2026-01-02T00:00:00Z",
        metadataJson: JSON.stringify({ eventTypes: ["archlucid.alert.recorded"] }),
      },
    ]);

    render(<SlackIntegrationPageClient />);

    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Slack notification destinations" })).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "Events" })).toBeInTheDocument();
  });

  it("requires confirmation before disabling an enabled Slack destination", async () => {
    mockList.mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Governance alerts",
        channelType: "SlackWebhook",
        destination: "https://hooks.slack.com/services/SECRET/PATH",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        lastDeliveredUtc: "2026-01-02T00:00:00Z",
        metadataJson: JSON.stringify({ eventTypes: ["archlucid.alert.recorded"] }),
      },
    ]);

    render(<SlackIntegrationPageClient />);

    fireEvent.click(await screen.findByTestId("slack-toggle-sub-1"));

    expect(screen.getByText(/Disable Slack destination Governance alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Governance alerts will no longer post/i)).toBeInTheDocument();
    expect(mockToggle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith("sub-1");
    });

    expect(await screen.findByTestId("slack-integration-mutation-success-callout")).toHaveTextContent(
      SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
    );
  });
});
