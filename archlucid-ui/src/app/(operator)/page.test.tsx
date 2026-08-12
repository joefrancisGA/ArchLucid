import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const listRunsByProjectPaged = vi.fn();
const getPilotScorecard = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listRunsByProjectPaged: (...args: unknown[]) => listRunsByProjectPaged(...args),
  getPilotScorecard: (...args: unknown[]) => getPilotScorecard(...args),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/trial/TrialWelcomeRunDeepLink", () => ({
  TrialWelcomeRunDeepLink: () => null,
}));

vi.mock("@/components/operator/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: import("react").ReactNode }) => <>{children}</>,
}));

vi.mock("./_sections/operator-home-page-view-deferred-chunks", async () => {
  const Link = (await import("next/link")).default;
  const { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } = await import("@/lib/architecture/architecture-workflow-labels");
  const {
    OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
    OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  } = await import("@/lib/buyer/buyer-polish-copy");

  function DualPathHeroMock() {
    return (
      <div data-testid="pilot-command-center-card">
        <div data-testid="operator-home-dual-path-cards">
          <button type="button">{CREATE_ARCHITECTURE_LABEL}</button>
          <button type="button">{START_REVIEW_LABEL}</button>
          <Link href="/architecture/reviews/claims-intake-modernization">{OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA}</Link>
        </div>
      </div>
    );
  }

  return {
    PilotCommandCenterCardDeferred: DualPathHeroMock,
    BuyerPolishedHomeHeroSectionDeferred: () => (
      <section data-testid="operator-home-hero-section">
        <DualPathHeroMock />
      </section>
    ),
    OperatorHomeExecutiveRoiStripDeferred: () => null,
    OperatorHomeBelowFoldPanelsDeferred: () => (
      <section data-testid="operator-home-explore-sample-section">
        <Link
          data-testid="operator-home-explore-run-sample-review"
          href="/architecture/reviews/new?template=claims-intake-modernization"
        >
          {OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA}
        </Link>
      </section>
    ),
    OperatorHomeGateDeferred: ({ children }: { children: import("react").ReactNode }) => <>{children}</>,
    CtoDemoExecutiveLandingRedirectDeferred: () => null,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => false,
  useNavCallerAuthorityRank: () => 3,
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
    currentPrincipal: {
      hasCommittedArchitectureReview: false,
    },
  }),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  tryStaticDemoRunSummariesPaged: vi.fn(() => null),
  isStaticDemoPayloadFallbackEnabled: vi.fn(() => false),
}));

vi.mock("@/components/cto-demo/CtoDemoResetButton", () => ({
  CtoDemoResetButton: () => (
    <button type="button" data-testid="cto-demo-reset-button-mock">
      Reset demo
    </button>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeAdvancedGuidancePanel", () => ({
  OperatorHomeAdvancedGuidancePanel: (props: { readonly buyerPolishedShell?: boolean }) =>
    props.buyerPolishedShell === true ? null : <div data-testid="operator-home-advanced-guidance" />,
}));

vi.mock("@/components/cto-demo/CtoDemoExecutiveLandingRedirect", () => ({
  CtoDemoExecutiveLandingRedirect: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeExecutiveRoiStrip", () => ({
  OperatorHomeExecutiveRoiStrip: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeWorkspaceContextDisclosure", () => ({
  OperatorHomeWorkspaceContextDisclosure: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredOnboarding", () => ({
  OperatorHomeDeferredOnboarding: () => null,
  OperatorHomeFirstValueCallout: () => null,
}));

vi.mock("@/components/dev-testing/DevTestingQuickSwitchPanel", () => ({
  DevTestingQuickSwitchPanel: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", async () => {
  return {
    OperatorHomeRunsPanel: ({
      initialModel,
    }: {
      initialModel?: { items?: ReadonlyArray<unknown> } | null;
    }) => (
      <div data-testid="runs-dashboard-panel">
        {(initialModel?.items?.length ?? 0) > 0 ? (
          <div data-testid="runs-dashboard-status-filters" role="group" aria-label="Filter reviews">
            <button type="button" aria-pressed="true" data-testid="runs-dashboard-filter-all">
              All
            </button>
          </div>
        ) : null}
      </div>
    ),
  };
});

const useFeaturedCompletedSampleQuery = vi.fn();

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => useFeaturedCompletedSampleQuery(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => ({
    phase: "ready",
    context: {
      healthReady: true,
      healthLoadFailed: false,
      principalAdmin: true,
    },
    readyCount: 4,
    totalCount: 4,
  }),
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: vi.fn(),
    reset: vi.fn(),
    isNavigating: false,
    isPending: false,
    activeStageId: null,
    showStagedPanel: false,
    stages: [],
    loadingLabel: "Starting review…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate: vi.fn(),
    reset: vi.fn(),
    isNavigating: false,
    loadingLabel: "Starting architecture…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => ({
    isPending: false,
    isError: false,
    data: {
      hasCommittedManifest: false,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
    },
  }),
}));

vi.mock("./_sections/load-operator-home-runs-dashboard-model", () => ({
  loadOperatorHomeRunsDashboardModel: vi.fn(),
}));

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { loadOperatorHomeRunsDashboardModel } from "./_sections/load-operator-home-runs-dashboard-model";
import { OperatorHomeRunsDashboardAsync } from "./_sections/OperatorHomeRunsDashboardAsync";
import type { OperatorHomeRunsDashboardModel } from "./_sections/operator-home-runs-dashboard-model";
import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import type { RunSummary } from "@/types/authority";

const mockLoadOperatorHomeRunsDashboardModel = vi.mocked(loadOperatorHomeRunsDashboardModel);

function featuredCompletedSampleAvailable() {
  return {
    isPending: false,
    isError: false,
    data: {
      selectedRunId: "claims-intake-modernization",
      isConfigured: true,
      isAvailable: true,
      reviewTitle: "Claims intake modernization",
      architectureName: "Claims intake modernization",
      completedUtc: "2026-01-01T00:00:00.000Z",
      isSampleApproved: true,
    },
  };
}

function defaultRunsDashboard(buyerPolishedShell = false): OperatorHomeRunsDashboardModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 5,
    items: [],
    totalCount: 0,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    buyerPolishedShell,
  };
}

const sampleHomeRun: RunSummary = {
  runId: "33333333-3333-3333-3333-333333333333",
  projectId: "default",
  description: "Active review",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasFindingsSnapshot: true,
  hasGoldenManifest: false,
};

function runsDashboardWithSampleRun(buyerPolishedShell = false): OperatorHomeRunsDashboardModel {
  return {
    ...defaultRunsDashboard(buyerPolishedShell),
    items: [sampleHomeRun],
    totalCount: 1,
  };
}

async function renderHomePage(): Promise<void> {
  // Resolve the Suspense child directly — page.tsx streams this under Suspense for FCP.
  const page = await OperatorHomeRunsDashboardAsync({
    buyerPolishedShell: isBuyerPolishedOperatorShellEnv(),
  });

  renderWithOperatorQuery(page);
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  mockLoadOperatorHomeRunsDashboardModel.mockResolvedValue(defaultRunsDashboard());
  useFeaturedCompletedSampleQuery.mockReturnValue(featuredCompletedSampleAvailable());
  listRunsByProjectPaged.mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 5,
    hasMore: false,
  });
  getPilotScorecard.mockResolvedValue(null);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/api/proxy/health/ready")) {
        return new Response(JSON.stringify({ status: "Healthy", entries: [] }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/roi-baseline")) {
        return new Response(JSON.stringify({ complete: true }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/tenant/trial-status")) {
        return new Response(JSON.stringify({ status: "None" }), { status: 200 });
      }

      if (url.includes("/api/proxy/v1/pilots/runs/recent-deltas")) {
        return new Response(JSON.stringify({ runs: [] }), { status: 200 });
      }

      return new Response("not found", { status: 404 });
    }),
  );
});

describe("HomePage — buyer-polished shell", () => {
  useOperatorQueryTestLifecycle();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the home launchpad focused on dual-path hero, workspace activity, and explore sample", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    mockLoadOperatorHomeRunsDashboardModel.mockResolvedValue(defaultRunsDashboard(true));

    await renderHomePage();

    expect(screen.getByTestId("pilot-command-center-card")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-outcomes")).toBeNull();
    expect(screen.queryByText("What you'll get")).toBeNull();
    expect(screen.queryByTestId("operator-home-example-request-panel")).toBeNull();
    expect(screen.queryByTestId("operator-home-sample-review-preview")).toBeNull();
    expect(screen.getByTestId("operator-home-explore-sample-section")).toBeInTheDocument();

    const workspaceActivityHeading = screen.getByRole("heading", { name: "Recent reviews" });
    expect(workspaceActivityHeading).toBeInTheDocument();

    const exploreSample = screen.getByTestId("operator-home-explore-sample-section");
    expect(workspaceActivityHeading.compareDocumentPosition(exploreSample) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId("operator-home-advanced-guidance")).toBeNull();
    expect(screen.queryByTestId("operator-home-workspace-context")).not.toBeInTheDocument();
    expect(screen.queryByText("ROI estimate pending")).toBeNull();
    expect(screen.queryByText("Advanced Analysis")).toBeNull();
    expect(screen.queryByText("Operational metrics")).toBeNull();
    expect(screen.queryByText(/AI co-architect/i)).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-status-filters")).toBeNull();
  });
});

describe("HomePage (55R smoke — landing)", () => {
  useOperatorQueryTestLifecycle();

  it("renders dual-path hero, workspace activity, and consolidated explore sample section", async () => {
    await renderHomePage();

    expect(screen.getByRole("heading", { name: "Recent reviews" })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-example-request-panel")).toBeNull();
    expect(screen.queryByTestId("operator-home-sample-review-preview")).toBeNull();
    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("pilot-command-center-open-completed-sample")).toBeNull();
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-example")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-try-sample")).toBeNull();
    expect(screen.getByTestId("operator-home-explore-run-sample-review")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?template=claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-explore-open-completed-sample")).toBeNull();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toBeInTheDocument();
    // Buyer-polished home omits the advanced-guidance rail; workflow help is on the hero help control.
    expect(screen.queryByTestId("operator-home-advanced-guidance")).toBeNull();
    expect(screen.queryByTestId("operator-home-workspace-context")).not.toBeInTheDocument();
    expect(screen.queryByText("ROI estimate pending")).toBeNull();
    expect(screen.queryByText("Advanced Analysis")).toBeNull();
  });

  it("exposes create and review CTAs from the dual-path hero", async () => {
    await renderHomePage();

    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_REVIEW_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA })).toBeInTheDocument();
  });

  it("exposes recent-reviews filter pills instead of an Open all reviews footer link", async () => {
    mockLoadOperatorHomeRunsDashboardModel.mockResolvedValue(runsDashboardWithSampleRun());
    listRunsByProjectPaged.mockResolvedValue({
      items: [sampleHomeRun],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });

    await renderHomePage();

    await waitFor(() => {
      expect(screen.getByTestId("runs-dashboard-filter-all")).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "Open all reviews" })).toBeNull();
  });
});
