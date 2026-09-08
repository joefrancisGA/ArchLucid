import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();
const mockCreate = vi.fn();
const mockToggle = vi.fn();
const mockTest = vi.fn();
const mockDryRun = vi.fn();

const navigationMocks = vi.hoisted(() => {
  let searchParams = new URLSearchParams();
  const replace = vi.fn((href: string) => {
    const queryIndex = href.indexOf("?");

    searchParams = new URLSearchParams(queryIndex >= 0 ? href.slice(queryIndex + 1) : "");
  });

  return {
    replace,
    searchParams: (): URLSearchParams => searchParams,
    resetSearchParams: (): void => {
      searchParams = new URLSearchParams();
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/integrations/slack",
  useRouter: () => ({ push: vi.fn(), replace: navigationMocks.replace, refresh: vi.fn() }),
  useSearchParams: () => navigationMocks.searchParams(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
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

vi.mock("@/lib/api", () => ({
  listAlertRoutingSubscriptions: (...args: unknown[]) => mockList(...args),
  createAlertRoutingSubscription: (...args: unknown[]) => mockCreate(...args),
  toggleAlertRoutingSubscription: (...args: unknown[]) => mockToggle(...args),
  testWebhookSubscription: (...args: unknown[]) => mockTest(...args),
  dryRunOutboundWebhook: (...args: unknown[]) => mockDryRun(...args),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { SlackIntegrationPageClient } from "@/app/(operator)/integrations/slack/_sections/SlackIntegrationPageClient";
import {
  SLACK_INTEGRATION_FIRST_VIEWPORT_TEST_ID,
  SLACK_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  SLACK_INTEGRATION_PAGE_SUBTITLE_BUYER,
  SLACK_INTEGRATION_PRIMARY_CONTENT_ID,
  SLACK_INTEGRATION_SKIP_LINK_LABEL,
  SLACK_INTEGRATION_SKIP_TARGET_ID,
} from "@/lib/slack-integration-shell-page-copy";
import {
  SLACK_INTEGRATION_CLAIM_DISCIPLINE,
  SLACK_INTEGRATION_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_SOURCES,
} from "@/lib/slack-integration-evidence-copy";
import {
  SLACK_INTEGRATION_PAGE_SUBTITLE,
  SLACK_INTEGRATION_PAGE_TITLE,
} from "@/lib/slack-integration-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("SlackIntegrationPageClient buyer-polished shell (ISN)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.resetSearchParams();
    mockList.mockResolvedValue([]);
    mockCreate.mockResolvedValue({});
    mockToggle.mockResolvedValue({});
    mockTest.mockResolvedValue({ transportSucceeded: true, statusCode: 200, responseBodyTruncated: false });
    mockDryRun.mockResolvedValue({ transportSucceeded: true, statusCode: 200, responseBodyTruncated: false });
  });

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", async () => {
    render(<SlackIntegrationPageClient />);

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });

    expect(screen.getByRole("link", { name: SLACK_INTEGRATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SLACK_INTEGRATION_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(SLACK_INTEGRATION_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SLACK_INTEGRATION_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId(SLACK_INTEGRATION_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      SLACK_INTEGRATION_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("slack-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("slack-readiness-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-teams-slack-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("slack-refresh-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SLACK_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("slack-page-title")).toHaveTextContent(SLACK_INTEGRATION_PAGE_TITLE);

    const primaryContent = screen.getByTestId(SLACK_INTEGRATION_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(SLACK_INTEGRATION_FIRST_VIEWPORT_TEST_ID);
    const pageLayout = screen.getByTestId("slack-page-layout");
    const orientationBottom = screen.getByTestId("slack-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("slack-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(firstViewport).toContainElement(pageLayout);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(SLACK_INTEGRATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
