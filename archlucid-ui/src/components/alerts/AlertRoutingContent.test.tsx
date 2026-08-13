import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AlertRulesHubRefreshProvider, useAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER } from "@/lib/alert-routing-presentation";
import {
  alertRoutingCreateSubscriptionButtonLabelReaderRank,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator/operator-last-refreshed-label";

import { AlertRoutingContent } from "./AlertRoutingContent";

const apiHoisted = vi.hoisted(() => ({
  listAlertRoutingSubscriptions: vi.fn(),
  createAlertRoutingSubscription: vi.fn(),
  toggleAlertRoutingSubscription: vi.fn(),
  listAlertRoutingDeliveryAttempts: vi.fn(),
  testWebhookSubscription: vi.fn(),
}));

const mutateCapability = vi.hoisted(() => ({ current: true }));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => mutateCapability.current,
}));

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: apiHoisted.listAlertRoutingSubscriptions,
  createAlertRoutingSubscription: apiHoisted.createAlertRoutingSubscription,
  toggleAlertRoutingSubscription: apiHoisted.toggleAlertRoutingSubscription,
  listAlertRoutingDeliveryAttempts: apiHoisted.listAlertRoutingDeliveryAttempts,
  testWebhookSubscription: apiHoisted.testWebhookSubscription,
}));

function FreshnessProbe(): React.JSX.Element {
  const { lastRefreshedAt } = useAlertRulesHubRefresh();

  return (
    <span data-testid="freshness">
      {lastRefreshedAt === null ? OPERATOR_NOT_REFRESHED_LABEL : "refreshed"}
    </span>
  );
}

function renderWithHub(ui: React.ReactElement): ReturnType<typeof render> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AlertRulesHubRefreshProvider activeTab="notifications">
        <FreshnessProbe />
        {ui}
      </AlertRulesHubRefreshProvider>
    </QueryClientProvider>,
  );
}

function fillValidDestinationForm(): void {
  fireEvent.change(screen.getByLabelText(/destination name/i), {
    target: { value: "Ops email" },
  });
  fireEvent.change(screen.getByTestId("alert-routing-destination-input"), {
    target: { value: "ops@example.com" },
  });
}

describe("AlertRoutingContent", () => {
  beforeEach(() => {
    mutateCapability.current = true;
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([]);
    apiHoisted.createAlertRoutingSubscription.mockResolvedValue({
      routingSubscriptionId: "sub-1",
      channelType: "Email",
    });
  });

  it("shows default High and Critical threshold preview", async () => {
    renderWithHub(<AlertRoutingContent />);

    expect(await screen.findByTestId("alert-routing-threshold-preview")).toHaveTextContent(
      "This destination will receive High and Critical alerts.",
    );
  });

  it("stamps hub freshness after the first successful load", async () => {
    renderWithHub(<AlertRoutingContent />);

    await waitFor(() => {
      expect(screen.getByTestId("freshness")).toHaveTextContent("refreshed");
    });
  });

  it("uses channel-specific destination labels", async () => {
    renderWithHub(<AlertRoutingContent />);

    expect(screen.getByText("Email recipients")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /notification channel/i }), {
      target: { value: "SlackWebhook" },
    });

    expect(screen.getByText("Slack webhook URL")).toBeInTheDocument();
  });

  it("keeps create disabled until destination validation passes", async () => {
    renderWithHub(<AlertRoutingContent />);

    const createButton = await screen.findByTestId("alert-routing-create-destination");
    expect(createButton).toBeDisabled();

    fillValidDestinationForm();

    expect(createButton).toBeEnabled();
  });

  it("keeps create disabled when email destination is invalid", async () => {
    renderWithHub(<AlertRoutingContent />);

    const createButton = await screen.findByTestId("alert-routing-create-destination");

    fireEvent.change(screen.getByLabelText(/destination name/i), {
      target: { value: "Ops email" },
    });
    fireEvent.change(screen.getByTestId("alert-routing-destination-input"), {
      target: { value: "not-an-email" },
    });

    expect(createButton).toBeDisabled();
    expect(apiHoisted.createAlertRoutingSubscription).not.toHaveBeenCalled();
  });

  it("creates a destination with default minimum severity", async () => {
    renderWithHub(<AlertRoutingContent />);

    fillValidDestinationForm();
    fireEvent.click(screen.getByTestId("alert-routing-create-destination"));

    await waitFor(() => {
      expect(apiHoisted.createAlertRoutingSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          minimumSeverity: "High",
          destination: "ops@example.com",
          name: "Ops email",
        }),
      );
    });
  });

  it("starts with an empty destination name and placeholder guidance", async () => {
    renderWithHub(<AlertRoutingContent />);

    await screen.findByTestId("alert-routing-empty-state");

    const nameInput = screen.getByLabelText(/destination name/i);

    expect(nameInput).toHaveValue("");
    expect(nameInput).toHaveAttribute("placeholder", ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER);
  });

  it("places getting-started guidance below the form in the empty state (TB-1481)", async () => {
    renderWithHub(<AlertRoutingContent />);

    const emptyState = await screen.findByTestId("alert-routing-empty-state");

    const formHeading = screen.getByRole("heading", { name: "Set up alert delivery", level: 3 });
    const gettingStartedSteps = screen.getByRole("list");

    expect(emptyState).toContainElement(formHeading);
    expect(formHeading.compareDocumentPosition(gettingStartedSteps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "Test alerts" })).toHaveAttribute(
      "href",
      "/governance/alert-rules?tab=test-alerts",
    );
    expect(screen.queryByRole("button", { name: "Go to destination form" })).not.toBeInTheDocument();
    expect(screen.queryByText("No notification destinations configured")).not.toBeInTheDocument();
  });

  it("does not show subscription in visible copy", async () => {
    renderWithHub(<AlertRoutingContent />);

    await screen.findByTestId("alert-routing-empty-state");

    expect(screen.queryByText(/subscription/i)).not.toBeInTheDocument();
    expect(screen.getByText("Destination name")).toBeInTheDocument();
  });

  it("updates threshold preview and warns when exact severities exclude Critical", async () => {
    renderWithHub(<AlertRoutingContent />);

    fireEvent.click(screen.getByRole("button", { name: /customize exact severities/i }));

    const highOnly = screen.getByRole("checkbox", { name: /^High$/i });
    fireEvent.click(highOnly);

    expect(await screen.findByTestId("alert-routing-threshold-preview")).toHaveTextContent(
      "This destination will receive High alerts only.",
    );
    expect(screen.getByTestId("alert-routing-threshold-critical-warning")).toHaveTextContent(
      /Critical alerts are excluded/i,
    );
  });

  it("shows provenance and aggregate delivery health when destinations exist", async () => {
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        name: "Ops email",
        channelType: "Email",
        destination: "ops@example.com",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-15T12:00:00.000Z",
        createdByActor: "alex@contoso.com",
        lastDeliveredUtc: "2026-01-16T12:00:00.000Z",
        metadataJson: "{}",
      },
    ]);

    renderWithHub(<AlertRoutingContent />);

    expect(await screen.findByTestId("alert-routing-config-provenance")).toHaveTextContent(
      /Configuration last changed by alex@contoso.com/i,
    );
    expect(screen.getByRole("link", { name: "View audit trail" })).toHaveAttribute("href", "/governance/audit");
    expect(screen.getByTestId("alert-routing-delivery-health")).toHaveTextContent("1 of 1 delivering");
    expect(screen.getByTestId("alert-routing-delivery-status-sub-1")).toHaveTextContent("Delivering");
  });

  it("confirms before disabling an enabled destination", async () => {
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        name: "Ops email",
        channelType: "Email",
        destination: "ops@example.com",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-15T12:00:00.000Z",
        createdByActor: "alex@contoso.com",
        lastDeliveredUtc: "2026-01-16T12:00:00.000Z",
        metadataJson: "{}",
      },
    ]);
    apiHoisted.toggleAlertRoutingSubscription.mockResolvedValue(undefined);

    renderWithHub(<AlertRoutingContent />);

    fireEvent.click(await screen.findByTestId("alert-routing-toggle-sub-1"));

    expect(screen.getByRole("heading", { name: /Disable webhook subscription Ops email/i })).toBeInTheDocument();
    expect(apiHoisted.toggleAlertRoutingSubscription).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(apiHoisted.toggleAlertRoutingSubscription).toHaveBeenCalledWith("sub-1");
    });
  });

  it("shows visible WhyDisabled hint when mutation controls are read-only (TB-2361)", async () => {
    mutateCapability.current = false;

    renderWithHub(<AlertRoutingContent />);

    await screen.findByTestId("alert-routing-empty-state");

    const createButton = screen.getByTestId("alert-routing-create-destination");

    expect(createButton).toBeDisabled();
    expect(screen.getByTestId("alert-routing-mutate-disabled-hint")).toHaveTextContent(
      enterpriseMutationControlDisabledTitle,
    );
    expect(createButton).toHaveAttribute("aria-describedby", "alert-routing-mutate-disabled-hint");
    expect(screen.getByRole("button", { name: alertRoutingCreateSubscriptionButtonLabelReaderRank })).toBe(
      createButton,
    );
  });

  it("shows list toggle WhyDisabled hint when destinations exist and mutation is unavailable (TB-2361)", async () => {
    mutateCapability.current = false;
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([
      {
        routingSubscriptionId: "sub-1",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        name: "Ops email",
        channelType: "Email",
        destination: "ops@example.com",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-15T12:00:00.000Z",
        createdByActor: "alex@contoso.com",
        lastDeliveredUtc: "2026-01-16T12:00:00.000Z",
        metadataJson: "{}",
      },
    ]);

    renderWithHub(<AlertRoutingContent />);

    await screen.findByTestId("alert-routing-destination-list");

    const hint = screen.getByTestId("alert-routing-list-mutate-disabled-hint");

    expect(hint).toHaveTextContent(enterpriseMutationControlDisabledTitle);
    expect(screen.getByTestId("alert-routing-toggle-sub-1")).toHaveAttribute(
      "aria-describedby",
      "alert-routing-list-mutate-disabled-hint",
    );
  });
});
