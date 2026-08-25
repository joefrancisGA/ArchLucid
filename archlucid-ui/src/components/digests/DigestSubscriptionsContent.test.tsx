import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";
import { digestSubscriptionsCreateSubscriptionButtonLabelReaderRank, enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

const mutateCapability = vi.hoisted(() => ({ current: true }));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => mutateCapability.current,
}));

vi.mock("@/lib/api", () => ({
  listDigestSubscriptions: vi.fn(),
  createDigestSubscription: vi.fn(),
  toggleDigestSubscription: vi.fn(),
  listSubscriptionDeliveryAttempts: vi.fn(),
}));

vi.mock("@/lib/api/tenant-customer-success", () => ({
  fetchTenantIntegrationsOperations: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isOperatorExperienceFullShellEnv: () => true,
}));

import {
  createDigestSubscription,
  listDigestSubscriptions,
  listSubscriptionDeliveryAttempts,
  toggleDigestSubscription,
} from "@/lib/api";
import { fetchTenantIntegrationsOperations } from "@/lib/api/tenant-customer-success";

describe("DigestSubscriptionsContent", () => {
  beforeEach(() => {
    mutateCapability.current = true;
    vi.mocked(listDigestSubscriptions).mockReset();
    vi.mocked(createDigestSubscription).mockReset();
    vi.mocked(listSubscriptionDeliveryAttempts).mockReset();
    vi.mocked(toggleDigestSubscription).mockReset();
    vi.mocked(fetchTenantIntegrationsOperations).mockReset();
    vi.mocked(listDigestSubscriptions).mockResolvedValue([]);
    vi.mocked(listSubscriptionDeliveryAttempts).mockResolvedValue([]);
    vi.mocked(toggleDigestSubscription).mockResolvedValue(undefined);
    vi.mocked(fetchTenantIntegrationsOperations).mockResolvedValue({
      connectors: [],
      integrationEventBus: {
        isConfigured: true,
        transportLabel: "Configured",
      },
    });
    vi.mocked(createDigestSubscription).mockResolvedValue({
      subscriptionId: "s-new",
      tenantId: "t",
      workspaceId: "w",
      projectId: "p",
      name: "Architecture digest — email",
      channelType: "Email",
      destination: "ops@example.com",
      isEnabled: true,
      createdUtc: "2026-07-08T12:00:00Z",
      metadataJson: "{}",
    });
  });

  it("renders customer-goal copy, readiness panel, and create affordance", async () => {
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    expect(await screen.findByRole("heading", { level: 2, name: "Delivery destinations" })).toBeInTheDocument();
    expect(
      screen.getByText("Send architecture digests to email or webhook destinations your team already uses."),
    ).toBeInTheDocument();
    expect(await screen.findByTestId("digest-subscriptions-readiness-panel")).toBeInTheDocument();
    expect(await screen.findByTestId("digest-subscriptions-empty")).toBeInTheDocument();
    expect(screen.getByText("No delivery destinations yet")).toBeInTheDocument();
    expect(screen.getByTestId("digest-subscription-create-button")).toBeInTheDocument();
    expect(screen.getByTestId("digest-preview-before-subscribe")).toBeInTheDocument();
    expect(screen.queryByLabelText("Digest type")).not.toBeInTheDocument();
    expect(screen.getByTestId("digest-subscriptions-privacy-note")).toBeInTheDocument();
  });

  it("disables save until destination is valid, shows readiness hint, and shows success", async () => {
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await screen.findByTestId("digest-subscriptions-empty");

    const createButton = screen.getByTestId("digest-subscription-create-button");
    expect(createButton).toBeDisabled();
    expect(screen.getByTestId("digest-subscription-create-disabled-hint")).toHaveTextContent(
      /Enter an email address or webhook URL/i,
    );
    expect(createButton).toHaveAttribute("aria-describedby", "digest-subscription-create-disabled-hint");
    expect(screen.getByLabelText("Email address (required)")).toBeRequired();

    fireEvent.change(screen.getByLabelText("Email address (required)"), { target: { value: "ops@example.com" } });
    expect(createButton).not.toBeDisabled();

    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createDigestSubscription).toHaveBeenCalled();
    });
    expect(await screen.findByTestId("digest-subscription-create-success")).toHaveTextContent(
      "Delivery destination saved",
    );
    expect(screen.getByTestId("mutating-in-tenant-chip")).toBeInTheDocument();
  });

  it("rejects duplicate email destinations", async () => {
    vi.mocked(listDigestSubscriptions).mockResolvedValue([
      {
        subscriptionId: "s1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Ops mailbox",
        channelType: "Email",
        destination: "ops@example.com",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00Z",
        metadataJson: "{}",
      },
    ]);

    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await screen.findByRole("table", { name: "Digest subscriptions" });

    const expandButton = screen.queryByRole("button", { name: "Add delivery destination" });

    if (expandButton !== null) {
      fireEvent.click(expandButton);
    }

    const emailField = await screen.findByLabelText("Email address (required)");
    fireEvent.change(emailField, { target: { value: "ops@example.com" } });
    fireEvent.blur(emailField);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/already has an active subscription/i);
    });
    expect(screen.getByTestId("digest-subscription-create-button")).toBeDisabled();
  });

  it("shows reader-rank save label when mutation is unavailable", async () => {
    mutateCapability.current = false;
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await waitFor(() => {
      expect(listDigestSubscriptions).toHaveBeenCalled();
    });

    const createButton = screen.getByRole("button", {
      name: digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
    });

    expect(createButton).toBeDisabled();
    expect(screen.getByTestId("digest-subscription-create-disabled-hint")).toHaveTextContent(
      enterpriseMutationControlDisabledTitle,
    );
    expect(createButton).toHaveAttribute("aria-describedby", "digest-subscription-create-disabled-hint");
  });

  it("renders subscription table with status and actions when rows exist", async () => {
    vi.mocked(listDigestSubscriptions).mockResolvedValue([
      {
        subscriptionId: "s1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Ops mailbox",
        channelType: "Email",
        destination: "ops@example.com",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00Z",
        lastDeliveredUtc: "2026-07-08T10:00:00Z",
        metadataJson: "{}",
      },
    ]);
    vi.mocked(listSubscriptionDeliveryAttempts).mockResolvedValue([
      {
        attemptId: "a1",
        digestId: "d1",
        subscriptionId: "s1",
        attemptedUtc: "2026-07-08T10:00:00Z",
        status: "Delivered",
        channelType: "Email",
        destination: "ops@example.com",
      },
    ]);

    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    expect(await screen.findByRole("table", { name: "Digest subscriptions" })).toBeInTheDocument();
    expect(screen.getAllByText("Ops mailbox").length).toBeGreaterThan(0);
    expect(screen.getByTestId("digest-subscriptions-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("digest-subscriptions-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("digest-subscription-more-s1"));
    expect(screen.getByRole("link", { name: "Send test digest" })).toHaveAttribute(
      "href",
      "/governance/advisory-scans?tab=schedules",
    );
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.getByTestId("digest-subscriptions-refresh")).toBeInTheDocument();
  });

  it("confirms before pausing an enabled digest destination", async () => {
    vi.mocked(listDigestSubscriptions).mockResolvedValue([
      {
        subscriptionId: "s1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Ops mailbox",
        channelType: "Email",
        destination: "ops@example.com",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00Z",
        metadataJson: "{}",
      },
    ]);

    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    fireEvent.click(await screen.findByTestId("digest-subscription-toggle-s1"));

    expect(screen.getByRole("heading", { name: /Pause digest delivery for Ops mailbox/i })).toBeInTheDocument();
    expect(toggleDigestSubscription).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Pause delivery" }));

    await waitFor(() => {
      expect(toggleDigestSubscription).toHaveBeenCalledWith("s1");
    });
  });

  it("shows visible WhyDisabled hint on list row actions when mutation is unavailable (TB-2360)", async () => {
    mutateCapability.current = false;
    vi.mocked(listDigestSubscriptions).mockResolvedValue([
      {
        subscriptionId: "s1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Ops mailbox",
        channelType: "Email",
        destination: "ops@example.com",
        isEnabled: true,
        createdUtc: "2026-07-01T00:00:00Z",
        metadataJson: "{}",
      },
    ]);

    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await screen.findByRole("table", { name: "Digest subscriptions" });

    const hint = screen.getByTestId("digest-subscriptions-mutate-disabled-hint");

    expect(hint).toHaveTextContent(enterpriseMutationControlDisabledTitle);
    expect(screen.getByTestId("digest-subscription-toggle-s1")).toHaveAttribute(
      "aria-describedby",
      "digest-subscriptions-mutate-disabled-hint",
    );
  });

  it("prefills the create form when Edit is clicked", async () => {
    vi.mocked(listDigestSubscriptions).mockResolvedValue([
      {
        subscriptionId: "s1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Ops mailbox",
        channelType: "Email",
        destination: "ops@example.com",
        isEnabled: false,
        createdUtc: "2026-07-01T00:00:00Z",
        metadataJson: '{"digestType":"architecture"}',
      },
    ]);

    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await screen.findByRole("button", { name: "Edit" });
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const nameField = await screen.findByLabelText("Delivery name");
    expect(nameField).toHaveValue("Ops mailbox");
    expect(screen.getByLabelText("Email address (required)")).toHaveValue("ops@example.com");
    expect(screen.getByLabelText("After saving")).not.toBeChecked();
  });

  it("shows one schedule setup link in readiness when schedule is missing", async () => {
    renderWithOperatorQuery(
      <DigestSubscriptionsContent
        healthSnap={{
          enabledAdvisoryScheduleCount: 0,
          digestSubscriptionCount: 0,
          enabledDigestSubscriptionCount: 0,
          digestSubscriptionsByEmailChannel: 0,
          digestSubscriptionsBySlackChannel: 0,
          digestSubscriptionsByTeamsChannel: 0,
          executiveEmailDigestIsConfigured: false,
          executiveEmailDigestEnabled: false,
          executiveDigestRecipientCount: 0,
          executiveDigestIanaTimeZoneId: "UTC",
          executiveDigestDayOfWeek: 1,
          executiveDigestHourOfDay: 8,
          setupGaps: [],
        }}
      />,
    );

    await screen.findByTestId("digest-subscriptions-readiness-panel");
    expect(screen.getAllByRole("link", { name: "Open schedule setup" })).toHaveLength(1);
  });

  it("focuses the create form from the empty-state action", async () => {
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await screen.findByTestId("digest-subscriptions-empty");
    fireEvent.click(screen.getByTestId("digest-subscriptions-empty-add-destination"));

    expect(await screen.findByLabelText("Email address (required)")).toHaveFocus();
  });
});
