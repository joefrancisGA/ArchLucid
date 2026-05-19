/**
 * Sanity checks for webhook settings UX wiring (validators + mocked alert-routing adapters).
 *
 * `@/components/WebhooksSettingsClient` depends on **`useOperateCapability`** and **`useNavCallerAuthorityRank`**;
 * we stub both so renders stay deterministic offline.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  test: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 2,
}));

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: apiMocks.list,
  createAlertRoutingSubscription: apiMocks.create,
  testWebhookSubscription: apiMocks.test,
  testIntegrationWebhook: apiMocks.test,
  toggleAlertRoutingSubscription: apiMocks.toggle,
}));

import WebhooksSettingsPage from "./page";

describe("WebhooksSettingsPage", () => {
  beforeEach(() => {
    apiMocks.list.mockReset();
    apiMocks.create.mockReset();
    apiMocks.test.mockReset();
    apiMocks.toggle.mockReset();

    apiMocks.list.mockResolvedValue([]);
    apiMocks.create.mockResolvedValue({});
  });

  it("submits webhook subscription payload with trimmed metadata", async () => {
    render(<WebhooksSettingsPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText(/subscription name/i), { target: { value: "Signal hook" } });
    fireEvent.change(screen.getByLabelText(/webhook url/i), {
      target: { value: "https://listener.example/webhook" },
    });
    fireEvent.change(screen.getByLabelText(/shared secret/i), { target: { value: `${"z".repeat(16)}x` } });
    fireEvent.click(screen.getByLabelText(/alert acknowledged/i));

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    await waitFor(() => {
      expect(apiMocks.create).toHaveBeenCalled();
    });

    const callBody = apiMocks.create.mock.calls[0][0];
    expect(callBody.channelType).toBe("TeamsWebhook");
    expect(callBody.destination).toBe("https://listener.example/webhook");

    expect(typeof callBody.metadataJson).toBe("string");

    expect(callBody.metadataJson.includes("zzz")).toBe(true);

    const parsedMeta = JSON.parse(callBody.metadataJson) as Record<string, unknown>;

    expect(Array.isArray(parsedMeta.eventTypes)).toBe(true);
    expect(parsedMeta.webhookSharedSecret).toContain("z");
    expect(parsedMeta.eventTypes).toEqual(
      expect.arrayContaining(["archlucid.alert.recorded", "archlucid.alert.acknowledged"]),
    );
  });

  it("shows HTTP status and response body after Test Webhook", async () => {
    const subscriptionId = "11111111-1111-1111-1111-111111111111";
    apiMocks.list.mockResolvedValue([
      {
        routingSubscriptionId: subscriptionId,
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Hook",
        channelType: "OnCallWebhook",
        destination: "https://listener.example/hook",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        metadataJson: JSON.stringify({ webhookSharedSecret: "z".repeat(16) }),
      },
    ]);
    apiMocks.test.mockResolvedValue({
      transportSucceeded: true,
      statusCode: 202,
      reasonPhrase: "Accepted",
      responseBodyPreview: '{"ok":true}',
      responseBodyTruncated: false,
    });

    render(<WebhooksSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId(`webhook-test-${subscriptionId}`)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`webhook-test-${subscriptionId}`));

    await waitFor(() => {
      expect(apiMocks.test).toHaveBeenCalledWith(subscriptionId);
    });

    expect(await screen.findByTestId(`webhook-test-result-${subscriptionId}`)).toHaveTextContent("HTTP 202");
    expect(screen.getByTestId(`webhook-test-result-${subscriptionId}`)).toHaveTextContent('{"ok":true}');
  });
});
