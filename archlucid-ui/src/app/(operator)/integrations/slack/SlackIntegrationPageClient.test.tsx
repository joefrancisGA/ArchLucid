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
import { SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import {
  SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
  SLACK_INTEGRATION_PAGE_SUBTITLE,
  SLACK_INTEGRATION_PAGE_TITLE,
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

  it("shows the page title before help content and an honest status", async () => {
    render(<SlackIntegrationPageClient />);

    expect(screen.getByRole("heading", { level: 1, name: SLACK_INTEGRATION_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(SLACK_INTEGRATION_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(await screen.findByTestId("slack-configuration-status")).toContainElement(
      screen.getByLabelText("Status: Not configured"),
    );
    expect(screen.getByTestId("slack-not-configured-next-step")).toHaveTextContent(
      SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
    );
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent("Slack notifications help");
    expect(screen.getAllByRole("link", { name: /^Integration readiness$/i })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /Configure Microsoft Teams/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Need a different channel\?/i)).not.toBeInTheDocument();

    const pageRoot = screen.getByTestId("integrations-slack-page");
    expect(pageRoot.className).not.toMatch(/\bspace-y-8\b/);
    expect(pageRoot.className).not.toMatch(/\bpy-8\b/);
    expect(pageRoot.className).toMatch(/\bpy-4\b/);
  });

  it("renders customer-facing form labels and Test-before-Save CTA hierarchy", async () => {
    render(<SlackIntegrationPageClient />);

    expect(await screen.findByRole("heading", { name: "Add Slack destination" })).toBeInTheDocument();
    expect(screen.getByLabelText("Destination name")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum alert severity")).toBeInTheDocument();
    expect(screen.getByLabelText("Slack incoming webhook URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Signing secret (optional)")).toBeInTheDocument();

    const testButton = screen.getByTestId("slack-test-button");
    const saveButton = screen.getByTestId("slack-save-button");

    expect(testButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
    expect(screen.getByTestId("slack-save-disabled-helper")).toHaveTextContent(
      /Send a successful test notification before saving/i,
    );
    expect(testButton.compareDocumentPosition(saveButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows polished empty state for destinations", async () => {
    render(<SlackIntegrationPageClient />);

    expect(await screen.findByTestId("slack-destinations-empty-state")).toHaveTextContent("No Slack destinations yet");
  });

  it("sends a dry-run test notification from the form", async () => {
    render(<SlackIntegrationPageClient />);

    const nameInput = await screen.findByLabelText("Destination name");
    const webhookInput = screen.getByLabelText("Slack incoming webhook URL");

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

    fireEvent.change(await screen.findByLabelText("Destination name"), {
      target: { value: "Governance alerts" },
    });
    fireEvent.blur(screen.getByLabelText("Destination name"));
    fireEvent.change(screen.getByLabelText("Slack incoming webhook URL"), {
      target: { value: "https://hooks.slack.com/services/T000/B000/XXXXXXXX" },
    });
    fireEvent.blur(screen.getByLabelText("Slack incoming webhook URL"));

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

    expect(await screen.findByTestId("slack-configuration-status")).toContainElement(
      screen.getByLabelText("Status: 1 active destination"),
    );
    expect(screen.queryByTestId("slack-not-configured-next-step")).not.toBeInTheDocument();
    const table = await screen.findByTestId("slack-destinations-table");
    expect(within(table).getByText("Governance alerts")).toBeInTheDocument();
    expect(screen.queryByText("https://hooks.slack.com/services/SECRET/PATH")).not.toBeInTheDocument();
  });
});
