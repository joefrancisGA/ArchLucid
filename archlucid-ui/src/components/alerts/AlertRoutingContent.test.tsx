import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("AlertRoutingContent", () => {
  beforeEach(() => {
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([]);
    apiHoisted.createAlertRoutingSubscription.mockResolvedValue({
      routingSubscriptionId: "sub-1",
      channelType: "Email",
    });
  });

  it("shows default High and Critical threshold preview", async () => {
    render(<AlertRoutingContent />);

    expect(await screen.findByTestId("alert-routing-threshold-preview")).toHaveTextContent(
      "This destination will receive High and Critical alerts.",
    );
  });

  it("uses channel-specific destination labels", async () => {
    render(<AlertRoutingContent />);

    expect(screen.getByText("Email recipients")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: /notification channel/i }), {
      target: { value: "SlackWebhook" },
    });

    expect(screen.getByText("Slack webhook URL")).toBeInTheDocument();
  });

  it("validates email before create", async () => {
    render(<AlertRoutingContent />);

    fireEvent.change(screen.getByTestId("alert-routing-destination-input"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByTestId("alert-routing-create-destination"));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(apiHoisted.createAlertRoutingSubscription).not.toHaveBeenCalled();
  });

  it("creates a destination with default minimum severity", async () => {
    render(<AlertRoutingContent />);

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
});
