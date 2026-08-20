import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/operator/operator-home-refresh-context", () => ({
  OperatorHomeRefreshProvider: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
  useOperatorHomeRefresh: () => ({ refreshing: false, requestRefresh: vi.fn() }),
}));

import { OperatorHomePageView } from "./OperatorHomePageView";
import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";
import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_PAGE_SUBTITLE,
} from "@/lib/operator/operator-home-page-copy";
import { OPERATOR_HOME_FOLLOW_UPS_TITLE } from "@/lib/operator/operator-home-evidence-copy";
import {
  OPERATOR_HOME_PRIMARY_CONTENT_ID,
  OPERATOR_HOME_SKIP_LINK_LABEL,
} from "./operator-home-page-surface-copy";

function mockHomeModel(): OperatorHomePageViewModel {
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
    },
  };
}

describe("OperatorHomePageView buyer-polished shell (HOM)", () => {
  it("renders skip link, orientation strip, buyer subtitle, and contextual help on overview", () => {
    render(<OperatorHomePageView model={mockHomeModel()} />);

    expect(screen.getByRole("link", { name: OPERATOR_HOME_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${OPERATOR_HOME_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("operator-home-primary-content")).toHaveAttribute(
      "id",
      OPERATOR_HOME_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("operator-home-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-settings-sources")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-page-subtitle")).toHaveTextContent(
      BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
    );
    expect(screen.queryByText(OPERATOR_HOME_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-settings-sources")).toHaveAttribute("data-layout", "columns");
    expect(screen.getByTestId("operator-home-settings-sources").querySelector("ul")).toHaveClass(
      "sm:grid-cols-2",
    );
    expect(screen.getByTestId("operator-home-settings-sources").querySelector("p")).toHaveClass("max-w-none");

    const primaryContent = screen.getByTestId("operator-home-primary-content");
    const orderedLandmarks = ["operator-home-hero-section", "operator-home-orientation-top"]
      .map((testId) => primaryContent.querySelector(`[data-testid="${testId}"]`))
      .filter((node): node is HTMLElement => node !== null)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["operator-home-hero-section", "operator-home-orientation-top"]);
  });
});
