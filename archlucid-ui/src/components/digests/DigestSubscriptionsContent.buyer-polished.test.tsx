import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DIGEST_SUBSCRIPTIONS_BUYER_START_HERE_HELPER,
  DIGEST_SUBSCRIPTIONS_PAGE_LEAD,
} from "@/lib/digest-subscriptions-workflow";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

vi.mock("@/lib/api", () => ({
  listDigestSubscriptions: vi.fn().mockResolvedValue([]),
  createDigestSubscription: vi.fn(),
  toggleDigestSubscription: vi.fn(),
  listSubscriptionDeliveryAttempts: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api/tenant-customer-success", () => ({
  fetchTenantIntegrationsOperations: vi.fn().mockResolvedValue({
    connectors: [],
    integrationEventBus: { isConfigured: true, transportLabel: "Configured" },
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";

describe("DigestSubscriptionsContent buyer-polished shell (AIS)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first-viewport intro, hides create affordances and readiness panel", async () => {
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} onPickReview={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("digests-subscriptions-first-viewport")).toBeInTheDocument();
    });

    expect(screen.getByTestId("digests-subscriptions-intro")).toHaveTextContent(DIGEST_SUBSCRIPTIONS_PAGE_LEAD);
    expect(screen.getByTestId("digests-subscriptions-buyer-start-here-helper")).toHaveTextContent(
      DIGEST_SUBSCRIPTIONS_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByTestId("digest-subscriptions-readiness-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscription-create-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscription-create-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-preview-before-subscribe")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscriptions-empty-add-destination")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscriptions-pick-review-before-creating-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscriptions-recipients-clarification")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscriptions-privacy-note")).not.toBeInTheDocument();
    expect(await screen.findByTestId("digest-subscriptions-empty")).toBeInTheDocument();
  });
});
