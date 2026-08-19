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

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
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
import {
  WEBHOOKS_BANNED_UI_PATTERNS,
  WEBHOOKS_EMPTY_TITLE,
  WEBHOOKS_ENABLE_CONFIRM_LABEL,
  WEBHOOKS_ENABLE_CONFIRM_TITLE,
  WEBHOOKS_PAGE_TITLE,
  webhooksEnableConfirmDescription,
} from "@/lib/webhooks-page-copy";
import { WEBHOOKS_INTEGRATION_SOURCES } from "@/lib/webhooks-integration-evidence-copy";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { WEBHOOKS_SURFACE_ICON } from "@/lib/webhooks-surface-icon";
import { WEBHOOK_SUBSCRIPTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { showError, showSuccess } from "@/lib/toast";

import WebhooksIntegrationPage from "./page";

function fillValidWebhookForm(): void {
  fireEvent.change(screen.getByLabelText(/^Subscription name$/i), { target: { value: "Signal hook" } });
  fireEvent.change(screen.getByLabelText(/^Destination URL$/i), {
    target: { value: "https://listener.example/webhook" },
  });
  fireEvent.change(screen.getByLabelText(/^Signing secret$/i), { target: { value: `${"z".repeat(16)}` } });
}

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

    expect(await screen.findByTestId("page-contextual-help-button")).toHaveTextContent("How webhooks work");
  });

  it("renders the Webhooks integration Sources and claim-discipline strip", async () => {
    render(<WebhooksIntegrationPage />);

    await screen.findByTestId("webhooks-integration-orientation");

    const sources = screen.getByTestId("webhooks-integration-sources");

    for (const link of WEBHOOKS_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    const readinessLinks = within(sources).getAllByRole("link", { name: "Integration readiness" });
    expect(readinessLinks).toHaveLength(1);
    expect(readinessLinks[0]).toHaveAttribute("href", INTEGRATIONS_READINESS_PATH);
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

    await screen.findByTestId("webhooks-integration-orientation");

    const page = screen.getByTestId("webhooks-page");
    const orientationStrip = screen.getByTestId("webhooks-integration-orientation");

    const linksOutsideOrientation = (name: string) =>
      within(page)
        .queryAllByRole("link", { name })
        .filter((element) => !orientationStrip.contains(element));

    expect(screen.queryByTestId("webhooks-dedicated-links")).not.toBeInTheDocument();
    expect(linksOutsideOrientation("Jira")).toHaveLength(0);
    expect(linksOutsideOrientation("ServiceNow")).toHaveLength(0);
    expect(linksOutsideOrientation("Microsoft Teams")).toHaveLength(0);
    expect(linksOutsideOrientation("Slack")).toHaveLength(0);
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
      expect(screen.getByTestId("webhook-save-button")).toBeDisabled();
    });

    const pageText = screen.getByTestId("webhooks-page").textContent ?? "";

    for (const pattern of WEBHOOKS_BANNED_UI_PATTERNS) {
      expect(pageText, `expected no match for ${pattern}`).not.toMatch(pattern);
    }
  });

  it("disables save until hard validation passes and shows readiness copy", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
    });

    expect(screen.getByTestId("webhook-save-button")).toBeDisabled();
    expect(screen.getByTestId("webhook-save-readiness")).toHaveTextContent(/subscription name/i);

    fillValidWebhookForm();

    await waitFor(() => {
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });
    expect(screen.queryByTestId("webhook-save-readiness")).toBeNull();
  });

  it("validates HTTPS URL and event selection on blur", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText(/^Subscription name$/i), { target: { value: "Signal hook" } });
    fireEvent.change(screen.getByLabelText(/^Signing secret$/i), { target: { value: `${"z".repeat(16)}` } });
    fireEvent.change(screen.getByLabelText(/^Destination URL$/i), { target: { value: "http://insecure.example/hook" } });
    fireEvent.blur(screen.getByLabelText(/^Destination URL$/i));
    expect(await screen.findByText(/must use HTTPS/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Destination URL$/i), { target: { value: "not-a-url" } });
    fireEvent.blur(screen.getByLabelText(/^Destination URL$/i));
    expect(await screen.findByText(/Enter a valid HTTPS URL/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Alert recorded/i));
    expect(await screen.findByTestId("webhook-save-readiness")).toHaveTextContent(/at least one event/i);
  });

  it("shows minimum severity only when alert events are selected", async () => {
    render(<WebhooksIntegrationPage />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
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
    });

    fireEvent.change(screen.getByLabelText(/^Subscription name$/i), { target: { value: "Signal hook" } });
    fireEvent.change(screen.getByLabelText(/^Destination URL$/i), {
      target: { value: "https://listener.example/webhook" },
    });
    fireEvent.change(screen.getByLabelText(/^Signing secret$/i), { target: { value: `${"z".repeat(16)}x` } });
    fireEvent.click(screen.getByLabelText(/Alert acknowledged/i));

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    await waitFor(() => {
      expect(apiMocks.create).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("webhook-save-success-callout")).toHaveTextContent("Subscription saved.");
    expect(showSuccess).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/^Signing secret$/i) as HTMLInputElement).value).toBe("");

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
    });

    fillValidWebhookForm();

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

    expect(screen.getByRole("table", { name: "Webhook subscriptions" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Subscription name$/i), { target: { value: "existing hook" } });
    fireEvent.change(screen.getByLabelText(/^Destination URL$/i), {
      target: { value: "https://listener.example/new" },
    });
    fireEvent.change(screen.getByLabelText(/^Signing secret$/i), { target: { value: `${"z".repeat(16)}` } });

    await waitFor(() => {
      expect(screen.getByTestId("webhook-save-button")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("webhook-save-button"));

    expect(await screen.findByText(/subscription with this name already exists/i)).toBeInTheDocument();
    expect(apiMocks.create).not.toHaveBeenCalled();
  });

  it("uses EnterpriseTable inventory for populated webhook subscriptions (TB-1648)", async () => {
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
      expect(screen.getByRole("table", { name: "Webhook subscriptions" })).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "Destination" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Signing secret" })).toBeInTheDocument();
  });

  it("renders subscriptions empty state before the create form when none exist", async () => {
    render(<WebhooksIntegrationPage />);

    expect(await screen.findByTestId("webhooks-subscriptions-section")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Subscriptions" })).toBeInTheDocument();
    expect(screen.getByTestId("webhooks-empty-state")).toHaveTextContent(WEBHOOKS_EMPTY_TITLE);
    expect(screen.getByRole("heading", { name: /New subscription/i })).toBeInTheDocument();
    expect(screen.queryByText(/0 subscriptions in this workspace/i)).not.toBeInTheDocument();
  });

  it("does not claim zero subscriptions while the list is still loading", async () => {
    let resolveList: (rows: unknown[]) => void = () => {};

    apiMocks.list.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve as (rows: unknown[]) => void;
        }),
    );

    render(<WebhooksIntegrationPage />);

    expect(await screen.findByTestId("webhooks-subscriptions-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-empty-state")).toBeNull();

    resolveList([]);

    expect(await screen.findByTestId("webhooks-empty-state")).toHaveTextContent(WEBHOOKS_EMPTY_TITLE);
  });

  it("reports disabled subscriptions without claiming the workspace is not configured", async () => {
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
        isEnabled: false,
        createdUtc: "2026-01-01T00:00:00Z",
        metadataJson: JSON.stringify({ webhookSharedSecret: "z".repeat(16) }),
      },
    ]);

    render(<WebhooksIntegrationPage />);

    expect(await screen.findByLabelText("Status: 1 subscription, none enabled")).toBeInTheDocument();
    expect(screen.queryByLabelText("Status: Not configured")).toBeNull();
    expect(screen.queryByTestId("webhooks-not-configured-next-step")).toBeNull();
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
      expect(apiMocks.list).toHaveBeenCalled();
    });

    fillValidWebhookForm();
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
    expect(screen.getByLabelText(/^Subscription name$/i)).toBeDisabled();
    expect(screen.getByTestId("webhooks-mutation-prerequisite-notice")).toHaveTextContent(/manage alert routing/i);
    expect(screen.getByTestId("webhooks-page").querySelector("[title]")).toBeNull();
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
      expect(apiMocks.list).toHaveBeenCalled();
    });

    expect(screen.getByLabelText(/^Subscription name$/i)).toHaveAttribute("id", "webhook-subscription-name");
    expect(screen.getByLabelText(/^Destination URL$/i)).toHaveAttribute("id", "webhook-url");
    expect(screen.getByLabelText(/^Signing secret$/i)).toHaveAttribute("id", "webhook-secret");
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

  it("requires confirmation before enabling a disabled webhook subscription", async () => {
    const subscriptionId = "sub-enable-1";
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
        isEnabled: false,
        createdUtc: "2026-01-01T00:00:00Z",
        metadataJson: JSON.stringify({ eventTypes: ["archlucid.alert.recorded"] }),
      },
    ]);

    render(<WebhooksIntegrationPage />);

    fireEvent.click(await screen.findByTestId(`webhook-toggle-${subscriptionId}`));

    expect(screen.getByText(WEBHOOKS_ENABLE_CONFIRM_TITLE)).toBeInTheDocument();
    expect(
      screen.getByText(webhooksEnableConfirmDescription("PagerDuty alerts")),
    ).toBeInTheDocument();
    expect(apiMocks.toggle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: WEBHOOKS_ENABLE_CONFIRM_LABEL }));

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

  it("exposes delivery contract disclosure with the backend signature header", async () => {
    render(<WebhooksIntegrationPage />);

    fireEvent.click(await screen.findByText(/Delivery and signature verification/i));

    expect(screen.getByTestId("webhooks-delivery-contract-disclosure")).toHaveTextContent(
      "X-ArchLucid-Webhook-Signature",
    );
    expect(screen.getByTestId("webhooks-delivery-contract-disclosure")).toHaveTextContent("sha256=");
    expect(screen.getByTestId("webhooks-delivery-contract-disclosure")).toHaveTextContent("alertId");
  });

  it("does not claim the subscription secret signs live alert deliveries", async () => {
    render(<WebhooksIntegrationPage />);

    fireEvent.click(await screen.findByText(/Delivery and signature verification/i));

    const disclosure = screen.getByTestId("webhooks-delivery-contract-disclosure");

    expect(disclosure).toHaveTextContent(/Test events .* are signed with the signing secret you enter here/i);
    expect(disclosure).toHaveTextContent(/Live alert deliveries are signed with the platform shared secret/i);
    expect(disclosure.textContent ?? "").not.toMatch(/keyed with your subscription signing secret/i);
  });

  it("clears the signing secret when operator scope switches workspaces", async () => {
    const { writeOperatorScopeToStorage } = await import("@/lib/operator/operator-scope-storage");

    writeOperatorScopeToStorage({
      tenantId: "tenant-a",
      workspaceId: "workspace-a",
      projectId: "project-a",
      workspaceLabel: "Workspace A",
      projectLabel: "Project A",
    });

    render(<WebhooksIntegrationPage />);
    await waitFor(() => expect(apiMocks.list).toHaveBeenCalled());

    const secret = `${"z".repeat(16)}-from-workspace-a`;
    fireEvent.change(screen.getByLabelText(/^Signing secret$/i), { target: { value: secret } });
    fireEvent.click(screen.getByRole("button", { name: /Show signing secret/i }));
    expect((screen.getByLabelText(/^Signing secret$/i) as HTMLInputElement).value).toBe(secret);

    apiMocks.list.mockClear();
    writeOperatorScopeToStorage({
      tenantId: "tenant-b",
      workspaceId: "workspace-b",
      projectId: "project-b",
      workspaceLabel: "Workspace B",
      projectLabel: "Project B",
    });

    await waitFor(() => {
      expect((screen.getByLabelText(/^Signing secret$/i) as HTMLInputElement).value).toBe("");
    });
    await waitFor(() => expect(apiMocks.list).toHaveBeenCalled());
  });
});
