import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertRulesHubRefreshProvider, useAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator-last-refreshed-label";

import { AlertRoutingContent } from "./AlertRoutingContent";

const apiHoisted = vi.hoisted(() => ({
  listAlertRoutingSubscriptions: vi.fn(),
  createAlertRoutingSubscription: vi.fn(),
  toggleAlertRoutingSubscription: vi.fn(),
  listAlertRoutingDeliveryAttempts: vi.fn(),
  testWebhookSubscription: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
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
  return render(
    <AlertRulesHubRefreshProvider activeTab="notifications">
      <FreshnessProbe />
      {ui}
    </AlertRulesHubRefreshProvider>,
  );
}

describe("AlertRoutingContent", () => {
  beforeEach(() => {
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

    fireEvent.change(screen.getByTestId("alert-routing-destination-input"), {
      target: { value: "ops@example.com" },
    });

    expect(createButton).toBeEnabled();
  });

  it("keeps create disabled when email destination is invalid", async () => {
    renderWithHub(<AlertRoutingContent />);

    const createButton = await screen.findByTestId("alert-routing-create-destination");

    fireEvent.change(screen.getByTestId("alert-routing-destination-input"), {
      target: { value: "not-an-email" },
    });

    expect(createButton).toBeDisabled();
    expect(apiHoisted.createAlertRoutingSubscription).not.toHaveBeenCalled();
  });

  it("creates a destination with default minimum severity", async () => {
    renderWithHub(<AlertRoutingContent />);

    fireEvent.change(screen.getByTestId("alert-routing-destination-input"), {
      target: { value: "ops@example.com" },
    });
    fireEvent.click(screen.getByTestId("alert-routing-create-destination"));

    await waitFor(() => {
      expect(apiHoisted.createAlertRoutingSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          minimumSeverity: "High",
          destination: "ops@example.com",
        }),
      );
    });
  });

  it("shows one Set up alert delivery orientation block in the empty state", async () => {
    renderWithHub(<AlertRoutingContent />);

    await screen.findByTestId("alert-routing-empty-state");

    expect(screen.getAllByText("Set up alert delivery")).toHaveLength(1);
    expect(screen.getByText("Destination details")).toBeInTheDocument();
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
});
