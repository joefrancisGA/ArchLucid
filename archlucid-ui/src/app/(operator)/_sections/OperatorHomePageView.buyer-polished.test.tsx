import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => false,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

vi.mock("./operator-home-page-view-deferred-chunks", () => ({
  BuyerPolishedHomeHeroSectionDeferred: () => <div data-testid="operator-home-hero-section" />,
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
  OPERATOR_HOME_PAGE_SUBTITLE,
} from "@/lib/operator/operator-home-page-copy";
import {
  OPERATOR_HOME_PRIMARY_CONTENT_ID,
  OPERATOR_HOME_SKIP_LINK_LABEL,
} from "./operator-home-page-surface-copy";

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
  it("renders skip link, buyer subtitle, and contextual help on first-run overview", () => {
    render(<OperatorHomePageView model={mockHomeModel()} />);

    expect(screen.getByRole("link", { name: OPERATOR_HOME_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OPERATOR_HOME_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("operator-home-primary-content")).toHaveAttribute(
      "id",
      OPERATOR_HOME_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("operator-home-orientation-top")).toBeNull();
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
    );
    expect(screen.queryByText(OPERATOR_HOME_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("operator-home-primary-content");
    const orderedLandmarks = ["operator-home-hero-section"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["operator-home-hero-section"]);
  });

  it("renders returning-home hierarchy with recommended next before recent reviews", () => {
    render(
      <OperatorHomePageView
        model={mockHomeModel({
          items: [
            {
              runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              projectId: "default",
              createdUtc: "2026-01-01T00:00:00Z",
              hasGoldenManifest: false,
            },
          ],
          totalCount: 1,
        })}
      />,
    );

    const primaryContent = screen.getByTestId("operator-home-primary-content");
    const orderedLandmarks = [
      "operator-home-recommended-next-card",
      "operator-home-workspace-metrics-strip",
      "operator-home-start-something",
      "home-block-runs-dashboard",
    ]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual([
      "operator-home-recommended-next-card",
      "operator-home-workspace-metrics-strip",
      "operator-home-start-something",
      "home-block-runs-dashboard",
    ]);
    expect(screen.queryByTestId("operator-home-hero-section")).toBeNull();
  });
});
