import { screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomePageView } from "@/app/(operator)/_sections/OperatorHomePageView";
import type { OperatorHomePageViewModel } from "@/app/(operator)/_sections/operator-home-page-view-model";
import {
  OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE,
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_RECENT_REVIEWS_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const OVERVIEW_BANNED_PATTERNS = [
  /\blane\b/i,
  /operating path/i,
  /full operating path/i,
  /fast path/i,
  /first-hour/i,
  /first-value/i,
  /session path/i,
  /runbook/i,
  /\bmcp\b/i,
  /v1\.1/i,
  /commercial next step/i,
] as const;

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

vi.mock("@/components/operator-home/OperatorHomeAdvancedGuidancePanel", async () => {
  const { OperatorHomeAdvancedGuidanceSection } = await import(
    "@/components/operator-home/OperatorHomeAdvancedGuidanceSection"
  );

  return {
    OperatorHomeAdvancedGuidancePanel: (props: {
      buyerPolishedShell: boolean;
      fullOperatorShell?: boolean;
      checklistVariant?: "full" | "compact";
    }) => <OperatorHomeAdvancedGuidanceSection {...props} />,
  };
});

vi.mock("@/components/operator-home/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/app/(operator)/_sections/operator-home-page-view-deferred-chunks", async () => {
  const { OperatorHomeGate } = await import("@/components/operator-home/OperatorHomeGate");
  const { PilotCommandCenterCard } = await import("@/components/usability/PilotCommandCenterCard");
  const { OperatorHomeBelowFoldPanels } = await import(
    "@/app/(operator)/_sections/OperatorHomeBelowFoldPanels"
  );
  const { OperatorHomeExecutiveRoiStrip } = await import(
    "@/components/operator-home/OperatorHomeExecutiveRoiStrip"
  );
  const { deriveOperatorHomeWorkspaceMetrics } = await import("@/lib/operator/operator-home-workspace-metrics");

  function BuyerPolishedHomeHeroSectionDeferred(props: {
    readonly runsDashboard: import("@/app/(operator)/_sections/operator-home-runs-dashboard-model").OperatorHomeRunsDashboardModel;
  }) {
    // Avoid importing BuyerPolishedHomeHeroSection (circular: it pulls this deferred module).
    const workspaceMetrics = deriveOperatorHomeWorkspaceMetrics(
      props.runsDashboard.items,
      props.runsDashboard.totalCount,
    );

    return (
      <section aria-label="Overview command center" data-testid="operator-home-hero-section">
        <PilotCommandCenterCard
          suppressLeadCopy
          showContextualHelp={false}
          runsDashboard={props.runsDashboard}
          hasWorkspaceReviews={workspaceMetrics.hasReviews}
          openFindingsCount={workspaceMetrics.openFindings}
          governanceWarningsCount={workspaceMetrics.governanceWarnings}
        />
      </section>
    );
  }

  return {
    OperatorHomeGateDeferred: OperatorHomeGate,
    BuyerPolishedHomeHeroSectionDeferred,
    PilotCommandCenterCardDeferred: PilotCommandCenterCard,
    OperatorHomeBelowFoldPanelsDeferred: OperatorHomeBelowFoldPanels,
    OperatorHomeExecutiveRoiStripDeferred: OperatorHomeExecutiveRoiStrip,
    CtoDemoExecutiveLandingRedirectDeferred: () => null,
  };
});

vi.mock("@/components/operator-home/OperatorHomeDeferredOnboarding", () => ({
  OperatorHomeDeferredOnboarding: () => null,
  OperatorHomeFirstValueCallout: () => null,
}));

vi.mock("@/components/operator-home/OperatorHomeExecutiveRoiStrip", () => ({
  OperatorHomeExecutiveRoiStrip: () => <div data-testid="home-block-executive-roi" />,
}));

vi.mock("@/components/operator-home/OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => <div data-testid="home-block-delta-panel" />,
  OperatorHomeRunsPanel: () => <div data-testid="home-block-runs-dashboard" />,
  OperatorHomeWorkspaceStatusPanel: () => <div data-testid="home-block-workspace-status" />,
}));

vi.mock("@/components/operator-home/OperatorHomeExamplesPlacement", () => ({
  OperatorHomeExamplesPlacement: ({
    afterWorkspaceContext,
  }: {
    afterWorkspaceContext: ReactNode;
  }) => <>{afterWorkspaceContext}</>,
}));

vi.mock("@/components/dev-testing/DevTestingQuickSwitchPanel", () => ({
  DevTestingQuickSwitchPanel: () => null,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
  useNavCallerAuthorityRank: () => 3,
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
    currentPrincipal: {
      hasCommittedArchitectureReview: false,
    },
  }),
}));

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => ({
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
  }),
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
    readyCount: 1,
    totalCount: 4,
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isOperatorExperienceFullShellEnv: vi.fn(() => true),
    isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
  };
});

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");
  const mockModule = await createCorePilotCommitContextModuleMock(importOriginal);
  const fetchCorePilotCommitContext = vi.mocked(mockModule.fetchCorePilotCommitContext);

  fetchCorePilotCommitContext.mockResolvedValue({
    hasCommittedManifest: false,
    committedReviewCount: 0,
    latestRunId: null,
    firstCommittedRunId: null,
    secondCommittedRunId: null,
    latestRunReadyToFinalize: false,
  });

  return mockModule;
});

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listRunsByProjectPaged: vi.fn().mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 5,
      hasMore: false,
    }),
  };
});

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...actual,
    tryStaticDemoRunSummariesPaged: vi.fn(() => null),
  };
});

function mockHomeModel(buyerPolishedShell: boolean): OperatorHomePageViewModel {
  return {
    buyerPolishedShell,
    runsDashboard: {
      projectId: "default",
      page: 1,
      pageSize: 5,
      items: [],
      totalCount: 0,
      loadFailure: null,
      malformedMessage: null,
      usedStaticRunsFallback: false,
      buyerPolishedShell,
    },
  };
}

function assertNoBannedOverviewVocabulary(root: HTMLElement): void {
  const text = root.textContent ?? "";

  for (const pattern of OVERVIEW_BANNED_PATTERNS) {
    expect(text, `banned Overview vocabulary: ${pattern}`).not.toMatch(pattern);
  }
}

describe("OperatorHomePageView overview vocabulary guard", () => {
  beforeEach(() => {
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

        if (url.includes("/api/proxy/v1/pilots/runs/recent-deltas")) {
          return new Response(JSON.stringify({ runs: [] }), { status: 200 });
        }

        return new Response("not found", { status: 404 });
      }),
    );
  });

  it("avoids banned first-use jargon on the full operator home shell", async () => {
    const { container } = renderWithOperatorQuery(<OperatorHomePageView model={mockHomeModel(false)} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: OPERATOR_HOME_INTENT_CHOOSER_HEADING })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: OPERATOR_HOME_RECENT_REVIEWS_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-card")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-do-this-next")).toBeInTheDocument();
    expect(screen.queryByText("Do this next")).toBeNull();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE })).toBeInTheDocument();
    });

    assertNoBannedOverviewVocabulary(container);
  });

  it("avoids banned first-use jargon on the buyer-polished home shell", async () => {
    const { container } = renderWithOperatorQuery(<OperatorHomePageView model={mockHomeModel(true)} />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: OPERATOR_HOME_INTENT_CHOOSER_HEADING })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: OPERATOR_HOME_RECENT_REVIEWS_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("pilot-command-center-card")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-do-this-next")).toBeInTheDocument();
    expect(screen.queryByText("Do this next")).toBeNull();
    expect(screen.queryByTestId("operator-home-advanced-guidance")).toBeNull();

    assertNoBannedOverviewVocabulary(container);
  });
});
