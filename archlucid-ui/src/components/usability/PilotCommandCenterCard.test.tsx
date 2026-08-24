import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PilotCommandCenterCard } from "@/components/usability/PilotCommandCenterCard";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { OPERATOR_HOME_SETUP_READINESS_HREF } from "@/lib/operator/operator-home-metric-hrefs";
import { PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT } from "@/lib/core-pilot-commit-context";

vi.mock("@/components/SampleReviewsOnOverviewPreferenceProvider", () => ({
  useSampleReviewsOnOverviewVisible: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import(
    "@/testing/operator-nav-authority-vitest-mock"
  );
  const base = createOperatorNavAuthorityVitestMock({
    callerAuthorityRank: 100,
    hasCommittedArchitectureReview: false,
  });

  return {
    ...base,
    useNavCommittedArchitectureReview: vi.fn(() => false),
    useNavCallerAuthorityRank: vi.fn(() => 100),
  };
});

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

const workspaceActivityMock = vi.hoisted(() => ({
  hasWorkspaceReviews: false,
  liveRunsSnapshot: null as { readonly items: readonly unknown[]; readonly totalCount: number } | null,
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    hasWorkspaceReviews: workspaceActivityMock.hasWorkspaceReviews,
    hasOverviewReviewRows: workspaceActivityMock.hasWorkspaceReviews,
    hasActionNeededReviews: false,
    openFindingsCount: 0,
    recentRunIds: [],
    liveRunsSnapshot: workspaceActivityMock.liveRunsSnapshot,
    reportWorkspaceReviews: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: vi.fn(() => []),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
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

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => ({
    isPending: false,
    isError: false,
    data: {
      selectedRunId: "customer-intake-modernization",
      isConfigured: true,
      isAvailable: true,
      reviewTitle: "Enterprise Customer Intake Modernization",
      architectureName: "Enterprise Customer Intake Modernization",
      completedUtc: "2026-01-01T00:00:00.000Z",
      isSampleApproved: true,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

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

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";

const emptyCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
};

describe("PilotCommandCenterCard", () => {
  beforeEach(() => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(emptyCommitContext);
    vi.mocked(useArchitectureDraftRegistryEntries).mockReturnValue([]);
    workspaceActivityMock.hasWorkspaceReviews = false;
    workspaceActivityMock.liveRunsSnapshot = null;
  });

  it("shows create and review lifecycle cards on empty Overview (ADR 0067)", async () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(
      screen.queryByRole("heading", { level: 2, name: OPERATOR_HOME_INTENT_CHOOSER_HEADING }),
    ).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-tagline")).toBeNull();

    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("first-pilot-operate-unlock-vocabulary")).toBeNull();
    expect(screen.getByTestId("operator-home-create-architecture-cta")).toHaveTextContent(
      CREATE_ARCHITECTURE_LABEL,
    );
    expect(screen.getByTestId("operator-home-review-architecture-cta")).toHaveTextContent(
      OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
    );
    expect(screen.queryByTestId("operator-home-do-this-next")).toBeNull();
    expect(screen.getByTestId("pilot-command-center-help")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(
      OPERATOR_NAV_LINK_LABELS.home,
    );
    fireEvent.click(screen.getByTestId("page-contextual-help-button"));
    expect(await screen.findByTestId("page-scoped-contextual-help-learn-more")).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
    expect(screen.queryByTestId("inline-guidance-recommended-next")).toBeNull();
    expect(screen.queryByText(/Recommended first/i)).toBeNull();
    expect(screen.queryByText(/Recommended next/i)).toBeNull();
  });

  it("shows resume-draft callout and lifecycle cards when drafts exist without reviews", () => {
    vi.mocked(useArchitectureDraftRegistryEntries).mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Claims intake",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
      },
    ]);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.getByTestId("pilot-command-center-card")).toHaveAttribute(
      "data-workspace-phase",
      "eval-with-drafts",
    );
    expect(
      screen.queryByRole("heading", { level: 2, name: "Claims intake" }),
    ).toBeNull();
    expect(screen.getByTestId("operator-home-draft-hero-labels")).toHaveTextContent(
      /Draft architecture — Updated/,
    );
    expect(screen.getByTestId("operator-home-draft-hero-labels")).not.toHaveTextContent(
      /undefined/,
    );
    expect(screen.getByTestId("operator-home-resume-draft-primary")).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-001",
    );
    expect(screen.getByTestId("operator-home-resume-draft-primary")).toHaveTextContent(
      OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
    );
    expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-lifecycle-recommended-review-architecture")).toBeNull();
    expect(screen.queryByTestId("first-pilot-operate-unlock-vocabulary")).toBeNull();
    expect(screen.queryByTestId("operator-home-do-this-next")).toBeNull();
  });

  it("routes submitted drafts back to the architecture draft workspace from home", () => {
    vi.mocked(useArchitectureDraftRegistryEntries).mockReturnValue([
      {
        architectureId: "draft-vertex",
        displayName: "Vertex",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-01T00:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-01T00:00:00.000Z",
        serverDraftStatus: "Submitted",
      },
    ]);

    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.getByTestId("operator-home-resume-draft-primary")).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-vertex",
    );
    expect(screen.getByTestId("operator-home-resume-draft-primary")).toHaveTextContent(
      OPERATOR_HOME_RESUME_LATEST_DRAFT_CTA,
    );
  });

  it("shows workspace overview hero copy after committed workspace activity", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(<PilotCommandCenterCard hasWorkspaceReviews />);

    expect(
      screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING }),
    ).toBeInTheDocument();
  });

  it("uses dynamic next-best-action copy from Core Pilot commit context after first commit", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

    renderWithOperatorQuery(
      <PilotCommandCenterCard openFindingsCount={2} hasWorkspaceReviews />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pilot-next-best-action")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pilot-next-best-action")).toHaveTextContent("Review open findings");
    expect(screen.getByTestId("pilot-command-center-lead")).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-dual-path-cards")).toBeNull();
  });

  it("does not lead with Review open findings when committed signal is set but workspace is empty", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);
    vi.mocked(fetchCorePilotCommitContext).mockResolvedValue({
      ...PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT,
      committedReviewCount: 0,
      latestRunId: null,
      firstCommittedRunId: null,
      secondCommittedRunId: null,
    });

    renderWithOperatorQuery(
      <PilotCommandCenterCard openFindingsCount={0} hasWorkspaceReviews={false} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-dual-path-cards")).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-home-review-architecture-cta")).toBeInTheDocument();
    expect(screen.queryByText("Review open findings")).toBeNull();
    expect(screen.queryByTestId("pilot-next-best-action")).toBeNull();
  });

  it("does not render optional setup links on the hero card", () => {
    renderWithOperatorQuery(<PilotCommandCenterCard />);

    expect(screen.queryByTestId("pilot-command-center-optional-setup")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-connect-azure")).toBeNull();
    expect(screen.queryByTestId("pilot-command-center-invite-reviewer")).toBeNull();
  });

  it("shows hero KPI strip when the workspace already has reviews", () => {
    renderWithOperatorQuery(
      <PilotCommandCenterCard
        hasWorkspaceReviews
        runsDashboard={{
          projectId: "default",
          page: 1,
          pageSize: 5,
          items: [
            {
              runId: "review-001",
              projectId: "default",
              createdUtc: "2026-01-15T12:00:00.000Z",
              hasFindingsSnapshot: true,
              hasGoldenManifest: false,
              findingCount: 1,
            },
          ],
          totalCount: 1,
          loadFailure: null,
          malformedMessage: null,
          usedStaticRunsFallback: false,
          buyerPolishedShell: true,
        }}
      />,
    );

    expect(screen.getByTestId("operator-home-hero-kpi-strip")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "4 of 4 ready" })).toHaveAttribute(
      "href",
      OPERATOR_HOME_SETUP_READINESS_HREF,
    );
    expect(screen.getByTestId("pilot-command-center-card")).toHaveAttribute(
      "data-workspace-phase",
      "active-reviews",
    );
  });

  it("shows refreshed hero KPI counts instead of the stale server snapshot", () => {
    workspaceActivityMock.hasWorkspaceReviews = true;
    workspaceActivityMock.liveRunsSnapshot = {
      items: [
        {
          runId: "review-001",
          projectId: "default",
          createdUtc: "2026-01-15T12:00:00.000Z",
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          findingCount: 1,
        },
        {
          runId: "review-002",
          projectId: "default",
          createdUtc: "2026-01-16T12:00:00.000Z",
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          findingCount: 1,
        },
        {
          runId: "review-003",
          projectId: "default",
          createdUtc: "2026-01-17T12:00:00.000Z",
          hasFindingsSnapshot: true,
          hasGoldenManifest: false,
          findingCount: 1,
        },
      ],
      totalCount: 3,
    };

    renderWithOperatorQuery(
      <PilotCommandCenterCard
        hasWorkspaceReviews
        runsDashboard={{
          projectId: "default",
          page: 1,
          pageSize: 5,
          items: [
            {
              runId: "review-001",
              projectId: "default",
              createdUtc: "2026-01-15T12:00:00.000Z",
              hasFindingsSnapshot: true,
              hasGoldenManifest: false,
              findingCount: 1,
            },
          ],
          totalCount: 1,
          loadFailure: null,
          malformedMessage: null,
          usedStaticRunsFallback: false,
          buyerPolishedShell: true,
        }}
      />,
    );

    const kpiStrip = screen.getByTestId("operator-home-hero-kpi-strip");

    expect(kpiStrip).toHaveTextContent("3 (0 finalized · 3 active)");
    expect(kpiStrip).not.toHaveTextContent("1 (0 finalized · 1 active)");
  });
});
