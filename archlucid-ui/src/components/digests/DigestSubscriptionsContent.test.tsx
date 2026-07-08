import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";
import { digestSubscriptionsCreateSubscriptionButtonLabelReaderRank } from "@/lib/enterprise-controls-context-copy";

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

import {
  createDigestSubscription,
  listDigestSubscriptions,
  listSubscriptionDeliveryAttempts,
} from "@/lib/api";

describe("DigestSubscriptionsContent", () => {
  beforeEach(() => {
    mutateCapability.current = true;
    vi.mocked(listDigestSubscriptions).mockReset();
    vi.mocked(createDigestSubscription).mockReset();
    vi.mocked(listSubscriptionDeliveryAttempts).mockReset();
    vi.mocked(listDigestSubscriptions).mockResolvedValue([]);
    vi.mocked(listSubscriptionDeliveryAttempts).mockResolvedValue([]);
    vi.mocked(createDigestSubscription).mockResolvedValue({
      subscriptionId: "s-new",
      tenantId: "t",
      workspaceId: "w",
      projectId: "p",
      name: "Architecture digest",
      channelType: "Email",
      destination: "ops@example.com",
      isEnabled: true,
      createdUtc: "2026-07-08T12:00:00Z",
      metadataJson: "{}",
    });
  });

  it("renders admin-safe copy, empty state, and primary create affordance", async () => {
    render(<DigestSubscriptionsContent />);

    expect(await screen.findByRole("heading", { level: 2, name: "Digest subscriptions" })).toBeInTheDocument();
    expect(
      screen.getByText("Choose who receives architecture digest summaries and where they are delivered."),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/fake email|API logs|webhook loggers/i);
    expect(await screen.findByTestId("digest-subscriptions-empty")).toBeInTheDocument();
    expect(screen.getByText("No digest subscriptions yet")).toBeInTheDocument();
    expect(screen.getByTestId("digest-subscription-create-button")).toHaveAttribute("data-testid");
    expect(screen.getByTestId("digest-subscriptions-refresh")).toBeInTheDocument();
    expect(screen.getByTestId("digest-subscriptions-privacy-note")).toBeInTheDocument();
  });

  it("disables create until destination is valid and shows Creating… / success", async () => {
    render(<DigestSubscriptionsContent />);

    await screen.findByTestId("digest-subscriptions-empty");

    const createButton = screen.getByTestId("digest-subscription-create-button");
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "ops@example.com" } });
    expect(createButton).not.toBeDisabled();

    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createDigestSubscription).toHaveBeenCalled();
    });
    expect(await screen.findByTestId("digest-subscription-create-success")).toHaveTextContent(
      "Subscription created",
    );
  });

  it("shows reader-rank create label when mutation is unavailable", async () => {
    mutateCapability.current = false;
    render(<DigestSubscriptionsContent />);

    await waitFor(() => {
      expect(listDigestSubscriptions).toHaveBeenCalled();
    });

    expect(
      screen.getByRole("button", { name: digestSubscriptionsCreateSubscriptionButtonLabelReaderRank }),
    ).toBeDisabled();
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

    render(<DigestSubscriptionsContent />);

    expect(await screen.findByRole("table", { name: "Digest subscriptions" })).toBeInTheDocument();
    expect(screen.getByText("Ops mailbox")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send test" })).toHaveAttribute("href", "/advisory?tab=schedules");
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
