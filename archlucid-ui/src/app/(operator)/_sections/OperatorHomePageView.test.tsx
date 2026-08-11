import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("./operator-home-page-view-deferred-chunks", () => ({
  PilotCommandCenterCardDeferred: () => <div data-testid="home-block-pilot-command-center" />,
  OperatorHomeExecutiveRoiStripDeferred: () => <div data-testid="home-block-executive-roi" />,
  OperatorHomeBelowFoldPanelsDeferred: (props: {
    readonly buyerPolishedShell?: boolean;
    readonly showFirstValueCallout?: boolean;
  }) => (
    <>
      <div data-testid="home-block-explore-sample" />
      {props.buyerPolishedShell === true ? null : (
        <>
          <div data-testid="home-block-workspace-context">
            <div data-testid="operator-home-workspace-metrics-summary" />
            <div data-testid="home-block-workspace-status" />
          </div>
          <div data-testid="home-block-advanced-guidance" />
        </>
      )}
    </>
  ),
  BuyerPolishedHomeHeroSectionDeferred: () => (
    <section data-testid="operator-home-hero-section">
      <div data-testid="home-block-pilot-command-center" />
    </section>
  ),
  OperatorHomeGateDeferred: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CtoDemoExecutiveLandingRedirectDeferred: () => null,
}));

// Product imports next/dynamic wrappers from deferred-chunks (TB-2145); leaf mocks alone never render.
vi.mock("./operator-home-page-view-deferred-chunks", () => ({
  PilotCommandCenterCardDeferred: () => <div data-testid="home-block-pilot-command-center" />,
  OperatorHomeExecutiveRoiStripDeferred: () => <div data-testid="home-block-executive-roi" />,
  OperatorHomeBelowFoldPanelsDeferred: ({
    buyerPolishedShell,
  }: {
    buyerPolishedShell: boolean;
  }) => (
    <>
      <div data-testid="home-block-explore-sample" />
      <div data-testid="home-block-workspace-context">
        <div data-testid="operator-home-workspace-metrics-summary" />
        {buyerPolishedShell ? null : <div data-testid="home-block-workspace-status" />}
      </div>
      {buyerPolishedShell ? null : <div data-testid="home-block-advanced-guidance" />}
    </>
  ),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => true),
  };
});

// Keep the real view under test, but stub shell chrome that pulls large client graphs (CI heap OOM on app-operator-e).
vi.mock("@/components/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="operator-page-container">{children}</div>,
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  OperatorHomeWorkspaceActivityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => <div data-testid="home-block-delta-panel" />,
  OperatorHomeRunsPanel: () => <div data-testid="home-block-runs-dashboard" />,
  OperatorHomeWorkspaceStatusPanel: () => <div data-testid="home-block-workspace-status" />,
}));

vi.mock("@/components/operator-home/UnfinishedWorkRail", () => ({
  UnfinishedWorkRail: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredOnboarding", () => ({
  OperatorHomeDeferredOnboarding: () => null,
  OperatorHomeFirstValueCallout: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

import { OperatorHomePageView } from "./OperatorHomePageView";
import { OPERATOR_HOME_PRIMARY_SECTION_HEADING } from "@/lib/design-tokens";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator-home-recent-reviews-heading";
import type { OperatorHomePageViewModel } from "./operator-home-page-view-model";

const mockRunsDashboard: OperatorHomePageViewModel["runsDashboard"] = {
  projectId: "default",
  page: 1,
  pageSize: 5,
  items: [],
  totalCount: 0,
  loadFailure: null,
  malformedMessage: null,
  usedStaticRunsFallback: false,
  buyerPolishedShell: false,
};

function mockHomeModel(buyerPolishedShell: boolean): OperatorHomePageViewModel {
  return {
    buyerPolishedShell,
    runsDashboard: { ...mockRunsDashboard, buyerPolishedShell },
  };
}

describe("OperatorHomePageView", () => {
  it("mounts Overview header chrome with PageContextualHelp (HOM / TB-1667)", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByTestId("operator-home-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
  });

  it("mounts Overview header chrome on buyer-polished home (HOM / TB-1667)", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    expect(screen.getByTestId("operator-home-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-scope-details")).toBeNull(); // TB-2093
  });

  it("renders an elevated Recent reviews section heading in buyer-polished home (TB-347)", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_RECENT_REVIEWS_HEADING });

    expect(heading).toHaveAttribute("id", "operator-home-reviews-heading");
    expect(heading.className).toContain("font-bold");
    expect(OPERATOR_HOME_PRIMARY_SECTION_HEADING).toContain("font-bold");
  });

  it("renders the same Recent reviews heading in full operator home (TB-347)", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_RECENT_REVIEWS_HEADING })).toBeInTheDocument();
  });

  it("orders buyer-polished home as hero, workspace activity, then explore sample without advanced guidance", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    expect(screen.getByTestId("operator-home-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-explore-sample")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-advanced-guidance")).toBeNull();
    expect(screen.queryByTestId("home-block-workspace-status")).toBeNull();
    expect(screen.queryByTestId("home-block-example-request")).toBeNull();

    const heroSection = screen.getByTestId("operator-home-hero-section");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const exploreSample = screen.getByTestId("home-block-explore-sample");

    expect(heroSection.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps operator shell hero, workspace activity, explore sample, workspace context, and advanced guidance in order", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByTestId("home-block-pilot-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-explore-sample")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-context")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-example-request")).toBeNull();

    const hero = screen.getByTestId("home-block-pilot-command-center");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const exploreSample = screen.getByTestId("home-block-explore-sample");
    const workspaceContext = screen.getByTestId("home-block-workspace-context");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");

    expect(hero.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exploreSample.compareDocumentPosition(workspaceContext) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspaceContext.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
