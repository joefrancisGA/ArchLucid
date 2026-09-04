import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const apiMocks = vi.hoisted(() => ({
  list: vi.fn(),
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
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: apiMocks.list,
  createAlertRoutingSubscription: vi.fn(),
  testWebhookSubscription: vi.fn(),
  toggleAlertRoutingSubscription: vi.fn(),
}));

import { WebhooksSettingsClient } from "@/app/(operator)/integrations/webhooks/WebhooksSettingsClient";
import {
  WEBHOOKS_INTEGRATION_FIRST_VIEWPORT_TEST_ID,
  WEBHOOKS_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  WEBHOOKS_INTEGRATION_PAGE_SUBTITLE_BUYER,
  WEBHOOKS_INTEGRATION_PRIMARY_CONTENT_ID,
  WEBHOOKS_INTEGRATION_SKIP_LINK_LABEL,
  WEBHOOKS_INTEGRATION_SKIP_TARGET_ID,
} from "@/lib/webhooks-integration-page-copy";
import {
  WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_SOURCES,
} from "@/lib/webhooks-integration-evidence-copy";
import { WEBHOOKS_PAGE_DESCRIPTION, WEBHOOKS_PAGE_TITLE } from "@/lib/webhooks-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("WebhooksSettingsClient buyer-polished shell (IWX)", () => {
  beforeEach(() => {
    apiMocks.list.mockReset();
    apiMocks.list.mockResolvedValue([]);
    useOperateCapabilityMock.mockReturnValue(true);
  });

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<WebhooksSettingsClient />);

    await waitFor(() => {
      expect(apiMocks.list).toHaveBeenCalled();
    });

    expect(screen.getByRole("link", { name: WEBHOOKS_INTEGRATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${WEBHOOKS_INTEGRATION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(WEBHOOKS_INTEGRATION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(WEBHOOKS_PAGE_DESCRIPTION)).not.toBeInTheDocument();
    expect(screen.getByTestId(WEBHOOKS_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      WEBHOOKS_INTEGRATION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("webhooks-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("webhooks-api-keys-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: WEBHOOKS_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: WEBHOOKS_PAGE_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(WEBHOOKS_INTEGRATION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(WEBHOOKS_INTEGRATION_FIRST_VIEWPORT_TEST_ID);
    const subscriptionsSection = screen.getByTestId("webhooks-subscriptions-section");
    const orientationBottom = screen.getByTestId("webhooks-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("webhooks-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(subscriptionsSection);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(WEBHOOKS_INTEGRATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
