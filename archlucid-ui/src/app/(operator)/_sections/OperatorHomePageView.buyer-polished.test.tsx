import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navCommittedReviewMock = vi.hoisted(() => vi.fn(() => false));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => navCommittedReviewMock(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

vi.mock("./operator-home-page-view-deferred-chunks", () => ({
  BuyerPolishedHomeHeroSectionDeferred: () => <div data-testid="operator-home-hero-section" />,
  DevTestingQuickSwitchPanelDeferred: () => null,
  OperatorHomeBelowFoldPanelsDeferred: () => <div data-testid="home-block-explore-sample" />,
  OperatorHomeSponsorRoiStripDeferred: () => null,
  OperatorHomeStickinessCockpitDeferred: () => <div data-testid="operator-home-stickiness-cockpit" />,
  OperatorHomeGateDeferred: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
  PilotCommandCenterCardDeferred: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredOnboarding", () => ({
  OperatorHomeDeferredOnboarding: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeRunsPanel: () => <div data-testid="home-block-runs-dashboard" />,
}));

vi.mock("@/components/operator-home/UnfinishedWorkRail", () => ({
  UnfinishedWorkRail: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeRecommendedNextCard", () => ({
  OperatorHomeRecommendedNextCard: () => <div data-testid="operator-home-recommended-next-card" />,
}));

vi.mock("@/components/operator-home/OperatorHomeWorkspaceMetricsStrip", () => ({
  OperatorHomeWorkspaceMetricsStrip: () => <div data-testid="operator-home-workspace-metrics-strip" />,
}));

vi.mock("@/components/operator-home/OperatorHomeCompactStartingActionsSection", () => ({
  OperatorHomeCompactStartingActionsSection: () => <div data-testid="operator-home-start-something" />,
}));

vi.mock("@/lib/operator/operator-home-refresh-context", () => ({
  OperatorHomeRefreshProvider: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
  useOperatorHomeRefresh: () => ({
    refreshing: false,
    lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
    requestRefresh: vi.fn(),
  }),
}));

import { OperatorHomePageView } from "./OperatorHomePageView";
import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";
import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
} from "@/lib/operator/operator-home-page-copy";
import {
  OPERATOR_HOME_BUYER_OVERVIEW,
  OPERATOR_HOME_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID,
  OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID,
  OPERATOR_HOME_PAGE_LEAD,
  OPERATOR_HOME_PRIMARY_CONTENT_ID,
  OPERATOR_HOME_SKIP_LINK_LABEL,
  OPERATOR_HOME_SKIP_TARGET_ID,
} from "./operator-home-page-surface-copy";
import {
  OPERATOR_HOME_CLAIM_DISCIPLINE,
  OPERATOR_HOME_FOLLOW_UPS_TITLE,
  OPERATOR_HOME_ORIENTATION_SOURCES,
} from "@/lib/operator/operator-home-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

function mockHomeModel(overrides?: Partial<OperatorHomePageViewModel["runsDashboard"]>): OperatorHomePageViewModel {
  return {
    buyerPolishedShell: true,
    runsDashboard: {
      projectId: "default",
      page: 1,
      pageSize: 5,
      items: [],
      totalCount: 0,
      loadFailure: null,
      malformedMessage: null,
      usedStaticRunsFallback: false,
      buyerPolishedShell: true,
      ...overrides,
    },
  };
}

describe("OperatorHomePageView buyer-polished shell (HOM)", () => {
  beforeEach(() => {
    navCommittedReviewMock.mockReturnValue(false);
  });

  it("renders skip link, intro lead, overview, workspace before follow-ups on first-run overview", () => {
    render(<OperatorHomePageView model={mockHomeModel()} />);

    expect(screen.getByRole("link", { name: OPERATOR_HOME_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OPERATOR_HOME_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(OPERATOR_HOME_PRIMARY_CONTENT_ID)).toHaveAttribute(
      "id",
      OPERATOR_HOME_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId(OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID)).toHaveAttribute(
      "id",
      OPERATOR_HOME_SKIP_TARGET_ID,
    );
    expect(screen.getByTestId(OPERATOR_HOME_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      OPERATOR_HOME_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("operator-home-orientation-top")).toBeNull();
    expect(screen.queryByTestId(OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID)).toBeNull();
    expect(screen.queryByTestId("operator-home-page-subtitle")).not.toBeInTheDocument();
    expect(screen.queryByText(BUYER_OPERATOR_HOME_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(OPERATOR_HOME_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID);
    const overview = screen.getByTestId("operator-home-overview");
    const workspace = screen.getByTestId("operator-home-workspace");

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("operator-home-intro")).toHaveTextContent(OPERATOR_HOME_PAGE_LEAD);
    expect(overview).toHaveTextContent(OPERATOR_HOME_BUYER_OVERVIEW);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(firstViewport).toContainElement(screen.getByTestId("operator-home-intro"));
    expect(within(workspace).getByTestId("operator-home-hero-section")).toBeInTheDocument();

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders returning-home hierarchy with metrics before recent reviews and orientation follow-ups", () => {
    navCommittedReviewMock.mockReturnValue(true);

    render(
      <OperatorHomePageView
        model={mockHomeModel({
          items: [
            {
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              projectId: "default",
              createdUtc: "2026-01-01T00:00:00Z",
              hasGoldenManifest: true,
            },
          ],
          totalCount: 1,
        })}
      />,
    );

    const workspace = screen.getByTestId("operator-home-workspace");
    const orderedLandmarks = [
      "operator-home-workspace-metrics-strip",
      "operator-home-start-something",
      "home-block-runs-dashboard",
    ]
      .map((testId) => workspace.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual([
      "operator-home-workspace-metrics-strip",
      "operator-home-start-something",
      "home-block-runs-dashboard",
    ]);
    expect(within(workspace).queryByTestId("operator-home-hero-section")).toBeNull();
    expect(within(workspace).queryByTestId("operator-home-recommended-next-card")).toBeNull();
    expect(screen.getByTestId(OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(OPERATOR_HOME_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID);
    const overview = screen.getByTestId("operator-home-overview");
    const orientationBottom = screen.getByTestId(OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("operator-home-settings-sources");

    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(OPERATOR_HOME_ORIENTATION_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
