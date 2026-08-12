/**
 * Webhooks integration page — navigation, copy, validation, and async feedback.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const apiMocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  test: vi.fn(),
  toggle: vi.fn(),
}));

const useOperateCapabilityMock = vi.hoisted(() => vi.fn(() => true));

vi.mock("next/navigation", () => ({
  usePathname: () => "/integrations/webhooks",
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => useOperateCapabilityMock(),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 2,
  useNavCommittedArchitectureReview: () => true,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 2,
      hasCommittedArchitectureReview: true,
    },
    callerAuthorityRank: 2,
    isAuthorityLoading: false,
  }),}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: apiMocks.list,
  createAlertRoutingSubscription: apiMocks.create,
  testWebhookSubscription: apiMocks.test,
  toggleAlertRoutingSubscription: apiMocks.toggle,
}));

import { OperateIntegrationsNavGroupBuilder } from "@/lib/operate-integrations-nav-group-builder";
import { resolveNavIconForHref } from "@/lib/resolve-nav-link-for-pathname";
import { WEBHOOKS_BANNED_UI_PATTERNS, WEBHOOKS_PAGE_TITLE } from "@/lib/webhooks-page-copy";
import { WEBHOOKS_SURFACE_ICON } from "@/lib/webhooks-surface-icon";
import { WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { showError, showSuccess } from "@/lib/toast";

import WebhooksIntegrationPage from "./page";

describe("WebhooksIntegrationPage", () => {
  beforeEach(() => {
    apiMocks.list.mockReset();
    apiMocks.create.mockReset();
    apiMocks.test.mockReset();
    apiMocks.toggle.mockReset();
    useOperateCapabilityMock.mockReset();
    useOperateCapabilityMock.mockReturnValue(true);

    apiMocks.list.mockResolvedValue([]);
    apiMocks.create.mockResolvedValue({});
  });

  it("is discoverable in Integrations navigation with the shared icon", () => {
    const group = new OperateIntegrationsNavGroupBuilder().build();
    const webhooksLink = group.links.find((link) => link.href === "/integrations/webhooks");

    expect(webhooksLink?.label).toBe("Webhooks");
    expect(webhooksLink?.icon).toBe(WEBHOOKS_SURFACE_ICON);
  });

  it("uses consistent page title terminology with shared nav icon", () => {
    render(<WebhooksIntegrationPage />);
    expect(screen.getByRole("heading", { name: WEBHOOKS_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(resolveNavIconForHref("/integrations/webhooks")).toBe(WEBHOOKS_SURFACE_ICON);
  });

  it("shows PageHeading contextual help with the Webhooks caption", async () => {
    render(<WebhooksIntegrationPage />);

    expect(await screen.findByTestId("page-contextual-help-button")).toHaveTextContent("Webhooks help");
  });

  it("uses operator spacing density on the page shell", async () => {
    render(<WebhooksIntegrationPage />);

    const pageRoot = await screen.findByTestId("webhooks-page");
    expect(pageRoot.className).not.toMatch(/\bspace-y-8\b/);
    expect(pageRoot.className).not.toMatch(/\bpy-8\b/);
    expect(pageRoot.className).toMatch(/\bpy-4\b/);
  });

  it("does not cross-link sibling Integrations products from page chrome", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("webhooks-dedicated-links")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Jira" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ServiceNow" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Microsoft Teams" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Slack" })).not.toBeInTheDocument();
    expect(screen.queryByText(/For dedicated workflows, use Jira/i)).not.toBeInTheDocument();
  });

  it("shows StatusTag and guided next step when no subscriptions exist", async () => {
    render(<WebhooksIntegrationPage />);

    expect(await screen.findByTestId("webhooks-configuration-status")).toContainElement(
      screen.getByLabelText("Status: Not configured"),
    );
    expect(screen.getByTestId("webhooks-not-configured-next-step")).toHaveTextContent(
      /Name the subscription, enter an HTTPS URL and signing secret/i,
    );
  });

  it("does not expose internal implementation language in the rendered page", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    const pageText = screen.getByTestId("webhooks-page").textContent ?? "";

    for (const pattern of WEBHOOKS_BANNED_UI_PATTERNS) {
      expect(pageText, `expected no match for ${pattern}`).not.toMatch(pattern);
    }
  });

  it("validates required fields, HTTPS URL, secret length, and event selection", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    expect(await screen.findByText(/Subscription name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Destination URL is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Signing secret must be at least 16 characters/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Alert recorded/i));
    fireEvent.click(screen.getByTestId("webhook-save-button"));
    expect(await screen.findByText(/Select at least one event/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/destination url/i), { target: { value: "http://insecure.example/hook" } });
    fireEvent.blur(screen.getByLabelText(/destination url/i));
    expect(await screen.findByText(/must use HTTPS/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/destination url/i), { target: { value: "not-a-url" } });
    fireEvent.blur(screen.getByLabelText(/destination url/i));
    expect(await screen.findByText(/Enter a valid HTTPS URL/i)).toBeInTheDocument();
  });

  it("shows minimum severity only when alert events are selected", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    expect(screen.getByLabelText(/Send alerts at or above/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Alert recorded/i));
    expect(screen.queryByLabelText(/Send alerts at or above/i)).toBeNull();

    fireEvent.click(screen.getByLabelText(/Alert acknowledged/i));
    expect(screen.getByLabelText(/Send alerts at or above/i)).toBeInTheDocument();
  });

  it("never redisplays the signing secret input after save and submits trimmed metadata", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/subscription name/i), { target: { value: "Signal hook" } });
    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://listener.example/webhook" },
    });
    fireEvent.change(screen.getByLabelText(/signing secret/i), { target: { value: `${"z".repeat(16)}x` } });
    fireEvent.click(screen.getByLabelText(/Alert acknowledged/i));

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    await waitFor(() => {
      expect(apiMocks.create).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("webhook-save-success-callout")).toHaveTextContent("Subscription saved.");
    expect(showSuccess).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/signing secret/i) as HTMLInputElement).value).toBe("");

    const callBody = apiMocks.create.mock.calls[0][0];
    expect(callBody.destination).toBe("https://listener.example/webhook");
    expect(callBody.metadataJson.includes("zzz")).toBe(true);
    expect(JSON.parse(callBody.metadataJson).eventTypes).toEqual(
      expect.arrayContaining(["archlucid.alert.recorded", "archlucid.alert.acknowledged"]),
    );
  });

  it("prevents duplicate submission while saving", async () => {
    let resolveCreate: (() => void) | undefined;
    apiMocks.create.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = () => resolve({});
        }),
    );

    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/subscription name/i), { target: { value: "Signal hook" } });
    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://listener.example/webhook" },
    });
    fireEvent.change(screen.getByLabelText(/signing secret/i), { target: { value: `${"z".repeat(16)}` } });

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    await waitFor(() => {
      expect(screen.getByTestId("webhook-save-button")).toHaveTextContent(/Saving subscription/i);
    });

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    expect(apiMocks.create).toHaveBeenCalledTimes(1);

    resolveCreate?.();
    await waitFor(() => {
      expect(screen.getByTestId("webhook-save-button")).toHaveTextContent(/Save subscription/i);
    });
  });

  it("rejects duplicate subscription names locally", async () => {
    apiMocks.list.mockResolvedValue([
      {
        routingSubscriptionId: "11111111-1111-1111-1111-111111111111",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Existing hook",
        channelType: "OnCallWebhook",
        destination: "https://listener.example/hook",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        metadataJson: JSON.stringify({ webhookSharedSecret: "z".repeat(16) }),
      },
    ]);

    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(screen.getByTestId("webhook-subscription-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/subscription name/i), { target: { value: "existing hook" } });
    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://listener.example/new" },
    });
    fireEvent.change(screen.getByLabelText(/signing secret/i), { target: { value: `${"z".repeat(16)}` } });
    fireEvent.click(screen.getByTestId("webhook-save-button"));

    expect(await screen.findByText(/subscription with this name already exists/i)).toBeInTheDocument();
    expect(apiMocks.create).not.toHaveBeenCalled();
  });

  it("keeps a single create story when empty (no Active/zero/empty-card theater)", async () => {
    render(<WebhooksIntegrationPage />);

    expect(await screen.findByTestId("webhooks-configuration-status")).toContainElement(
      screen.getByLabelText("Status: Not configured"),
    );
    expect(screen.getByTestId("webhooks-not-configured-next-step")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /New subscription/i })).toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-empty-state")).not.toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-subscriptions-section")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Active subscriptions/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/0 subscriptions in this workspace/i)).not.toBeInTheDocument();
  });

  it("renders existing subscriptions with masked destination hostname and secret status", async () => {
    const subscriptionId = "11111111-1111-1111-1111-111111111111";
    apiMocks.list.mockResolvedValue([
      {
        routingSubscriptionId: subscriptionId,
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Hook",
        channelType: "OnCallWebhook",
        destination: "https://listener.example/secret/path?token=abc",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        metadataJson: JSON.stringify({ webhookSharedSecret: "z".repeat(16), eventTypes: ["archlucid.alert.recorded"] }),
      },
    ]);

    render(<WebhooksIntegrationPage />);

    const card = await screen.findByTestId(`webhook-subscription-${subscriptionId}`);
    expect(within(card).getByText("listener.example/…")).toBeInTheDocument();
    expect(within(card).queryByText(/secret\/path/i)).toBeNull();
    expect(within(card).getByText(/Stored — copy is not shown/i)).toBeInTheDocument();
  });

  it("shows test pending, success, and failure feedback for saved subscriptions", async () => {
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

    render(<WebhooksIntegrationPage />);

    const testButton = await screen.findByTestId(`webhook-test-${subscriptionId}`);
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(apiMocks.test).toHaveBeenCalledWith(subscriptionId);
    });

    expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining("Test event delivered"));
    expect(await screen.findByTestId(`webhook-test-result-${subscriptionId}`)).toHaveTextContent("HTTP 202");

    apiMocks.test.mockResolvedValue({
      transportSucceeded: false,
      statusCode: 0,
      error: "Connection refused",
      responseBodyTruncated: false,
    });

    fireEvent.click(testButton);

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("We could not reach the destination.", "Connection refused");
    });
  });

  it("shows save failure feedback without raw internal errors", async () => {
    apiMocks.create.mockRejectedValue(new Error("routingSubscriptionId conflict in dbo.AlertRouting"));

    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/subscription name/i), { target: { value: "Signal hook" } });
    fireEvent.change(screen.getByLabelText(/destination url/i), {
      target: { value: "https://listener.example/webhook" },
    });
    fireEvent.change(screen.getByLabelText(/signing secret/i), { target: { value: `${"z".repeat(16)}` } });
    fireEvent.click(screen.getByTestId("webhook-save-button"));

    expect(await screen.findByText(/Could not save the subscription/i)).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-page").textContent).not.toMatch(/dbo\./i);
  });

  it("disables mutation controls when the operator lacks execute capability", async () => {
    useOperateCapabilityMock.mockReturnValue(false);

    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
    });

    expect(screen.getByTestId("webhook-save-button")).toBeDisabled();
    expect(screen.getByLabelText(/subscription name/i)).toBeDisabled();
    expect(apiMocks.create).not.toHaveBeenCalled();
  });

  it("shows test pending label while a test event is in flight", async () => {
    const subscriptionId = "11111111-1111-1111-1111-111111111111";
    let resolveTest: (() => void) | undefined;
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
    apiMocks.test.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveTest = () =>
            resolve({
              transportSucceeded: true,
              statusCode: 202,
              reasonPhrase: "Accepted",
              responseBodyTruncated: false,
            });
        }),
    );

    render(<WebhooksIntegrationPage />);

    const testButton = await screen.findByTestId(`webhook-test-${subscriptionId}`);
    fireEvent.click(testButton);

    expect(testButton).toHaveTextContent(/Sending test event/i);

    resolveTest?.();
    await waitFor(() => {
      expect(testButton).toHaveTextContent(/Send test event/i);
    });
  });

  it("associates form fields with accessible labels", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    expect(screen.getByLabelText(/Subscription name/i)).toHaveAttribute("id", "webhook-subscription-name");
    expect(screen.getByLabelText(/Destination URL/i)).toHaveAttribute("id", "webhook-url");
    expect(screen.getByLabelText(/Signing secret/i)).toHaveAttribute("id", "webhook-secret");
    expect(screen.getByRole("group", { name: /Webhook events/i })).toBeInTheDocument();
  });

  it("requires confirmation before disabling an enabled webhook subscription", async () => {
    const subscriptionId = "sub-disable-1";
    apiMocks.list.mockResolvedValue([
      {
        routingSubscriptionId: subscriptionId,
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "PagerDuty alerts",
        channelType: "OnCallWebhook",
        destination: "https://example.com/webhooks/archlucid",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00Z",
        metadataJson: JSON.stringify({ eventTypes: ["archlucid.alert.recorded"] }),
      },
    ]);

    render(<WebhooksIntegrationPage />);

    fireEvent.click(await screen.findByTestId(`webhook-toggle-${subscriptionId}`));

    expect(screen.getByText(/Disable webhook subscription PagerDuty alerts/i)).toBeInTheDocument();
    expect(screen.getByText(/Outbound HTTPS deliveries/i)).toBeInTheDocument();
    expect(apiMocks.toggle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(apiMocks.toggle).toHaveBeenCalledWith(subscriptionId);
    });
  });

  it("does not render mid-page About webhooks panel (TB-2093)", async () => {
    render(<WebhooksIntegrationPage />);

    expect(await screen.findByTestId("webhooks-page")).toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-about-panel")).toBeNull();
    expect(screen.queryByRole("heading", { name: /About webhooks/i })).toBeNull();
  });
});
