import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/operator-home/BuyerPolishedHomeHeroSection", () => ({
  BuyerPolishedHomeHeroSection: () => (
    <section data-testid="operator-home-hero-section">
      <div data-testid="home-block-pilot-command-center" />
    </section>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeExecutiveRoiStrip", () => ({
  OperatorHomeExecutiveRoiStrip: () => <div data-testid="home-block-executive-roi" />,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => <div data-testid="home-block-delta-panel" />,
  OperatorHomeRunsPanel: () => <div data-testid="home-block-runs-dashboard" />,
  OperatorHomeWorkspaceStatusPanel: () => <div data-testid="home-block-workspace-status" />,
}));

vi.mock("@/components/operator-home/OperatorHomeExploreSampleSection", () => ({
  OperatorHomeExploreSampleSection: () => <div data-testid="home-block-explore-sample" />,
}));

vi.mock("@/components/operator-home/OperatorHomeAdvancedGuidancePanel", () => ({
  OperatorHomeAdvancedGuidancePanel: () => <div data-testid="home-block-advanced-guidance" />,
}));

vi.mock("@/components/operator-home/OperatorHomeContinueSetupSlot", () => ({
  OperatorHomeContinueSetupSlot: () => <div data-testid="home-block-continue-setup" />,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredOnboarding", () => ({
  OperatorHomeDeferredOnboarding: () => null,
  OperatorHomeFirstValueCallout: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeWorkspaceContextDisclosure", () => ({
  OperatorHomeWorkspaceContextDisclosure: ({
    showWorkspaceStatus,
  }: {
    showWorkspaceStatus: boolean;
  }) => (
    <div data-testid="home-block-workspace-context">
      <div data-testid="operator-home-workspace-metrics-summary" />
      {showWorkspaceStatus ? <div data-testid="home-block-workspace-status" /> : null}
    </div>
  ),
}));

vi.mock("@/components/usability/PilotCommandCenterCard", () => ({
  PilotCommandCenterCard: () => <div data-testid="home-block-pilot-command-center" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => true),
  };
});

vi.mock("@/components/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
  it("renders an elevated Workspace activity section heading in buyer-polished home (TB-347)", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_RECENT_REVIEWS_HEADING });

    expect(heading).toHaveAttribute("id", "operator-home-reviews-heading");
    expect(heading.className).toContain("font-bold");
    expect(OPERATOR_HOME_PRIMARY_SECTION_HEADING).toContain("font-bold");
  });

  it("renders the same Workspace activity heading in full operator home (TB-347)", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_RECENT_REVIEWS_HEADING })).toBeInTheDocument();
  });

  it("orders buyer-polished home as hero, setup, workspace activity, explore sample, then advanced guidance", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    expect(screen.getByTestId("operator-home-hero-section")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-explore-sample")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-workspace-status")).toBeNull();
    expect(screen.queryByTestId("home-block-example-request")).toBeNull();

    const heroSection = screen.getByTestId("operator-home-hero-section");
    const continueSetup = screen.getByTestId("home-block-continue-setup");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const exploreSample = screen.getByTestId("home-block-explore-sample");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");

    expect(heroSection.compareDocumentPosition(continueSetup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(continueSetup.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exploreSample.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps operator shell hero, setup, workspace activity, explore sample, workspace context, and advanced guidance in order", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByTestId("home-block-pilot-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-continue-setup")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-explore-sample")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-context")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-example-request")).toBeNull();

    const hero = screen.getByTestId("home-block-pilot-command-center");
    const continueSetup = screen.getByTestId("home-block-continue-setup");
    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const exploreSample = screen.getByTestId("home-block-explore-sample");
    const workspaceContext = screen.getByTestId("home-block-workspace-context");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");

    expect(hero.compareDocumentPosition(continueSetup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(continueSetup.compareDocumentPosition(runsDashboard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(runsDashboard.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exploreSample.compareDocumentPosition(workspaceContext) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspaceContext.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
