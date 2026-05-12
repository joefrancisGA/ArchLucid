/**
 * Sanity checks for webhook settings UX wiring (validators + mocked alert-routing adapters).
 *
 * `@/components/WebhooksSettingsClient` depends on **`useEnterpriseMutationCapability`** and **`useNavCallerAuthorityRank`**;
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

vi.mock("@/hooks/use-enterprise-mutation-capability", () => ({
  useEnterpriseMutationCapability: () => true,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 2,
}));

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: apiMocks.list,
  createAlertRoutingSubscription: apiMocks.create,
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
});
