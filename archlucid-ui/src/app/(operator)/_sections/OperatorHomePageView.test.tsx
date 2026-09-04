import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const evalChromeShellState = vi.hoisted(() => ({ current: false }));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChromeShellState.current,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: "guided",
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  }),
}));

// Product imports next/dynamic wrappers from deferred-chunks (TB-2145); leaf mocks alone never render.
vi.mock("./operator-home-page-view-deferred-chunks", () => ({
  PilotCommandCenterCardDeferred: () => <div data-testid="home-block-pilot-command-center" />,
  OperatorHomeSponsorRoiStripDeferred: () => <div data-testid="home-block-sponsor-roi" />,
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
  OperatorHomeStickinessCockpitDeferred: () => <div data-testid="operator-home-stickiness-cockpit" />,
  DevTestingQuickSwitchPanelDeferred: () => <div data-testid="dev-testing-quick-switch" />,
  CtoDemoSponsorLandingRedirectDeferred: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => true),
  };
});

// Keep the real view under test, but stub shell chrome that pulls large client graphs (CI heap OOM on app-operator-e).
vi.mock("@/components/operator/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="operator-page-container">{children}</div>,
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  OperatorHomeWorkspaceActivityProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useOperatorHomeWorkspaceActivity: () => ({
    hasReviews: false,
    hasOverviewReviewRows: false,
    openFindingsCount: 0,
  }),
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => <div data-testid="home-block-delta-panel" />,
  OperatorHomeRunsPanel: () => <div data-testid="home-block-runs-dashboard" />,
  OperatorHomeWorkspaceStatusPanel: () => <div data-testid="home-block-workspace-status" />,
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

vi.mock("@/components/operator/OperatorAttentionKindStrip", () => ({
  OPERATOR_ATTENTION_KIND_STRIP_HELPER:
    "Needs-you queues — open a kind to see what needs action:",
  OperatorAttentionKindStrip: () => (
    <div data-testid="operator-attention-kind-strip">
      <p>Needs-you queues — open a kind to see what needs action:</p>
    </div>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredOnboarding", () => ({
  OperatorHomeDeferredOnboarding: () => null,
  OperatorHomeFirstValueCallout: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

import { OperatorHomePageView } from "./OperatorHomePageView";
import { OPERATOR_HOME_SECTION_HEADING } from "@/lib/design-tokens";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator/operator-home-recent-reviews-heading";
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

const sampleRun = {
  runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00Z",
  description: "Active review",
  hasFindingsSnapshot: false,
  hasGoldenManifest: false,
} as const;

function mockHomeModel(buyerPolishedShell: boolean): OperatorHomePageViewModel {
  evalChromeShellState.current = buyerPolishedShell;

  return {
    buyerPolishedShell,
    runsDashboard: {
      ...mockRunsDashboard,
      buyerPolishedShell,
      items: [sampleRun],
      totalCount: 1,
    },
  };
}

describe("OperatorHomePageView", () => {
  it("mounts Home header chrome with PageContextualHelp (HOM / TB-1667)", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByTestId("operator-home-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-refresh-button")).toBeInTheDocument();
  });

  it("mounts Home header chrome on buyer-polished home (HOM / TB-1667)", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    expect(screen.getByTestId("operator-home-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-scope-details")).toBeNull(); // TB-2093
  });

  it("renders Recent reviews as a secondary section heading in buyer-polished home (TB-347)", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    const heading = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_RECENT_REVIEWS_HEADING });

    expect(heading).toHaveAttribute("id", "operator-home-reviews-heading");
    expect(heading.className).toContain("font-semibold");
    expect(OPERATOR_HOME_SECTION_HEADING).toContain("font-semibold");
    expect(heading.className).not.toContain("font-bold");
  });

  it("renders the same Recent reviews heading in full operator home (TB-347)", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_RECENT_REVIEWS_HEADING })).toBeInTheDocument();
  });

  it("orders populated buyer-polished home as recent reviews, then explore sample without advanced guidance", () => {
    render(<OperatorHomePageView model={mockHomeModel(true)} />);

    expect(screen.queryByTestId("operator-home-orientation-top")).toBeNull();
    expect(screen.queryByTestId("operator-home-hero-section")).toBeNull();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-explore-sample")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-advanced-guidance")).toBeNull();
    expect(screen.queryByTestId("home-block-workspace-status")).toBeNull();
    expect(screen.queryByTestId("home-block-example-request")).toBeNull();

    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const exploreSample = screen.getByTestId("home-block-explore-sample");

    expect(runsDashboard.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps operator shell workspace activity, explore sample, workspace context, and advanced guidance in order", () => {
    render(<OperatorHomePageView model={mockHomeModel(false)} />);

    expect(screen.queryByTestId("home-block-pilot-command-center")).toBeNull();
    expect(screen.getByTestId("home-block-runs-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-explore-sample")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-context")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();
    expect(screen.getByTestId("home-block-advanced-guidance")).toBeInTheDocument();
    expect(screen.queryByTestId("home-block-example-request")).toBeNull();

    const runsDashboard = screen.getByTestId("home-block-runs-dashboard");
    const exploreSample = screen.getByTestId("home-block-explore-sample");
    const workspaceContext = screen.getByTestId("home-block-workspace-context");
    const advancedGuidance = screen.getByTestId("home-block-advanced-guidance");

    expect(runsDashboard.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(exploreSample.compareDocumentPosition(workspaceContext) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspaceContext.compareDocumentPosition(advancedGuidance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each([false, true])(
    "does not mount the stickiness cockpit on returning home (buyerPolishedShell=%s)",
    (buyerPolishedShell) => {
      evalChromeShellState.current = buyerPolishedShell;

      render(
        <OperatorHomePageView
          model={{
            buyerPolishedShell,
            runsDashboard: {
              ...mockRunsDashboard,
              buyerPolishedShell,
              items: [
                {
                  runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                  projectId: "default",
                  createdUtc: "2026-01-01T00:00:00Z",
                  hasGoldenManifest: true,
                },
              ],
              totalCount: 1,
            },
          }}
        />,
      );

      expect(screen.queryByTestId("operator-home-stickiness-cockpit")).not.toBeInTheDocument();
    },
  );

  it.each([false, true])(
    "mounts the dev testing quick switch after stickiness and sponsor ROI on first-run home (buyerPolishedShell=%s)",
    (buyerPolishedShell) => {
      render(<OperatorHomePageView model={mockHomeModel(buyerPolishedShell)} />);

      const quickSwitch = screen.getByTestId("dev-testing-quick-switch");
      const sponsorRoi = screen.getByTestId("home-block-sponsor-roi");

      if (buyerPolishedShell) {
        expect(screen.queryByTestId("operator-home-stickiness-cockpit")).toBeNull();
        expect(sponsorRoi.compareDocumentPosition(quickSwitch) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        return;
      }

      expect(screen.queryByTestId("operator-home-stickiness-cockpit")).toBeNull();
      expect(sponsorRoi.compareDocumentPosition(quickSwitch) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    },
  );

  it("shows the attention kind strip with helper copy on populated operator home (TB-2353)", () => {
    evalChromeShellState.current = false;

    render(
      <OperatorHomePageView
        model={{
          buyerPolishedShell: false,
          runsDashboard: {
            ...mockRunsDashboard,
            items: [sampleRun],
            totalCount: 1,
          },
        }}
      />,
    );

    expect(screen.getByTestId("operator-attention-kind-strip")).toBeInTheDocument();
    expect(screen.getByText(/Needs-you queues/)).toBeInTheDocument();
  });
});
