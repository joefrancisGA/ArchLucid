import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

const apiHoisted = vi.hoisted(() => ({
  listRunsByProjectPaged: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listRunsByProjectPaged: apiHoisted.listRunsByProjectPaged,
    fetchPagedReviewsInventory: vi.fn(async (params: {
      readonly projectId: string;
      readonly page: number;
      readonly pageSize: number;
      readonly cursor?: string | null;
      readonly scopeHeaders?: Record<string, string>;
    }) =>
      apiHoisted.listRunsByProjectPaged(params.projectId, params.page, params.pageSize, {
        cursor: params.cursor ?? "",
        scopeHeaders: params.scopeHeaders,
      })),
    restoreArchitectureRequest: vi.fn(),
  };
});

const runsDashBuyerPolishedForced = vi.hoisted(() => ({ on: false as boolean }));
const sampleReviewsVisibleMock = vi.hoisted(() => ({ value: true as boolean }));

vi.mock("@/components/SampleReviewsOnOverviewPreferenceProvider", () => ({
  useSampleReviewsOnOverviewVisible: () => sampleReviewsVisibleMock.value,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => runsDashBuyerPolishedForced.on,
  };
});

vi.mock("@/lib/demo-seeded-overview", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-seeded-overview")>();

  return {
    ...actual,
    shouldInjectDemoSeededOverviewSample: vi.fn(() => false),
  };
});

import { listRunsByProjectPaged } from "@/lib/api";
import {
  BUYER_RUNS_DASHBOARD_NO_APPROVED_PACKAGES,
  BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA,
  OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME,
  OPERATOR_HOME_WORKSPACE_EMPTY_BODY,
  OPERATOR_HOME_WORKSPACE_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  CUSTOMER_INTAKE_BUYER_REVIEW_TITLE,
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
} from "@/lib/samples/customer-intake-modernization/definition";
import * as operatorStaticDemo from "@/lib/operator/operator-static-demo";

import { OperatorHomeWorkspaceActivityProvider } from "@/components/operator-home/operator-home-workspace-activity-context";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

import { RunsDashboardPanel } from "./RunsDashboardPanel";

import type { RunSummary } from "@/types/authority";

const listRuns = vi.mocked(apiHoisted.listRunsByProjectPaged);

function buildInitialModel(
  overrides: Partial<OperatorHomeRunsDashboardModel> = {},
): OperatorHomeRunsDashboardModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 5,
    items: [],
    totalCount: 0,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    buyerPolishedShell: false,
    ...overrides,
  };
}

const originalFetch = globalThis.fetch;

function renderRunsDashboardPanel(ui: ReactElement = <RunsDashboardPanel />) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </OperatorHomeWorkspaceActivityProvider>,
  );
}

function stubFetchForDashboard() {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("/api/proxy/v1/pilots/runs/recent-deltas")) {
      return new Response(
        JSON.stringify({
          items: [],
          requestedCount: 5,
          returnedCount: 0,
          medianTotalFindings: null,
          medianTimeToCommittedManifestTotalSeconds: null,
          medianLlmCallCount: null,
        }),
        { status: 200 },
      );
    }

    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

describe("RunsDashboardPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders runs section and tabbed card", async () => {
    listRuns.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    expect(screen.getByRole("heading", { name: /^architecture reviews$/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("runs-dashboard-panel")).toBeInTheDocument();
    });
  });

  it("lists recent runs and links to run detail", async () => {
    const run: RunSummary = {
      runId: "11111111-1111-1111-1111-111111111111",
      projectId: "default",
      description: "Sample",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: false,
      hasGoldenManifest: false,
    };
    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    expect(await screen.findByTestId("recent-runs-home-panel")).toBeInTheDocument();
    const link = await screen.findByRole("link", { name: "Sample" });
    expect(link).toHaveAttribute("href", "/architecture/reviews/11111111-1111-1111-1111-111111111111");
  });

  it("surfaces findings insight signals on populated run rows", async () => {
    const run: RunSummary = {
      runId: "22222222-2222-2222-2222-222222222222",
      projectId: "default",
      description: "Cost review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      findingCount: 4,
      warningCount: 1,
      hasGovernanceWarnings: true,
    };
    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    expect(await screen.findByTestId(`run-home-list-insight-${run.runId}`)).toHaveTextContent(
      "4 findings · 1 monitored risk · package finalized",
    );
    // Home recent rows keep status in the insight line only — no inline Reviewed/READY/findings tags.
    expect(screen.queryByTestId("run-governance-warning-indicator")).toBeNull();
    expect(screen.queryByTestId("architecture-package-origin-reviewed")).toBeNull();
    expect(screen.queryByTestId("architecture-package-origin-created")).toBeNull();
  });

  it("shows empty state when there are no runs", async () => {
    const fallbackSpy = vi.spyOn(operatorStaticDemo, "tryStaticDemoRunSummariesPaged").mockReturnValue(null);

    try {
      listRuns.mockResolvedValue({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel();

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("runs-dashboard-status-filters")).toBeNull();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)),
      ).toBeInTheDocument();
    } finally {
      fallbackSpy.mockRestore();
    }
  });

  it("handles runs list API errors in the recent tab", async () => {
    const fallbackSpy = vi.spyOn(operatorStaticDemo, "tryStaticDemoRunSummariesPaged").mockReturnValue(null);

    try {
      listRuns.mockRejectedValue(new Error("runs unavailable"));
      stubFetchForDashboard();

      renderRunsDashboardPanel();

      await waitFor(() => {
        expect(screen.getByTestId("runs-dashboard-recent-error")).toBeInTheDocument();
      });
      expect(screen.getByText(/runs unavailable/i)).toBeInTheDocument();
    } finally {
      fallbackSpy.mockRestore();
    }
  });

  it("shows insight status for runs needing attention tab", async () => {
    const run: RunSummary = {
      runId: "00000000-0000-0000-0000-000000000099",
      projectId: "default",
      description: "Demo",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: false,
    };
    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /needs attention/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /needs attention/i }));

    expect(
      await screen.findByText("Findings ready · finalize this review to lock export readiness"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Review status:/i)).toBeNull();
  });

  it("filters to governance-warning runs when checkbox is checked", async () => {
    listRuns.mockResolvedValue({
      items: [
        {
          runId: "00000000-0000-0000-0000-000000000001",
          projectId: "default",
          description: "Clear",
          createdUtc: "2026-01-15T12:00:00.000Z",
          hasGovernanceWarnings: false,
        },
        {
          runId: "00000000-0000-0000-0000-000000000002",
          projectId: "default",
          description: "Needs follow-up",
          createdUtc: "2026-01-15T12:00:00.000Z",
          hasGovernanceWarnings: true,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    expect(await screen.findByRole("link", { name: "Clear" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Needs follow-up" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("runs-dashboard-governance-warnings-only"));

    expect(screen.queryByRole("link", { name: "Clear" })).toBeNull();
    expect(screen.getByRole("link", { name: "Needs follow-up" })).toBeInTheDocument();
  });

  it("surfaces monitoring in the insight line when run hasGovernanceWarnings is true", async () => {
    const run: RunSummary = {
      runId: "00000000-0000-0000-0000-000000000099",
      projectId: "default",
      description: "Governance follow-up",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
    };
    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    expect(await screen.findByTestId(`run-home-list-insight-${run.runId}`)).toHaveTextContent(
      "Package finalized · monitoring active",
    );
    expect(screen.queryByTestId("run-governance-warning-indicator")).toBeNull();
  });

  it("buyer-polished recent tab features sample review, omits showcase banner, and hides full list when only sample run", async () => {
    runsDashBuyerPolishedForced.on = true;

    try {
      const run: RunSummary = {
        runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
        projectId: "default",
        description: "Claims Intake sample",
        createdUtc: "2026-01-15T12:00:00.000Z",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
        hasGovernanceWarnings: true,
      };
      listRuns.mockResolvedValue({
        items: [run],
        totalCount: 1,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel();

      await waitFor(() => {
        expect(screen.getByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();
      });
      expect(screen.getByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();
      expect(screen.getByText("Package finalized")).toBeInTheDocument();
      expect(screen.queryByTestId("operator-home-showcase-demo-banner")).toBeNull();
      expect(screen.queryByRole("link", { name: "Jump to review journey" })).toBeNull();
      expect(screen.getByTestId("runs-dashboard-buyer-proof-title")).toHaveTextContent(
        CUSTOMER_INTAKE_BUYER_REVIEW_TITLE,
      );
      expect(screen.queryByRole("link", { name: CUSTOMER_INTAKE_BUYER_REVIEW_TITLE })).toBeNull();
      // Showcase title lives on the proof card — do not repeat it as a trailing list row.
      expect(screen.queryByTestId("recent-runs-home-panel")).toBeNull();
      expect(screen.queryByRole("link", { name: "Signed manifest summary" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Full review detail" })).toBeNull();
      // All / Approved / Action needed pills already cover list scope — no duplicate footer CTA.
      expect(screen.queryByTestId("runs-dashboard-open-review-packages")).toBeNull();
      expect(screen.queryByRole("link", { name: BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA })).toBeNull();
      expect(screen.queryByRole("link", { name: "All" })).toBeNull();
    } finally {
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("hides buyer proof card and sample row on Overview when sample reviews preference is off", async () => {
    runsDashBuyerPolishedForced.on = true;
    sampleReviewsVisibleMock.value = false;

    try {
      const run: RunSummary = {
        runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
        projectId: "default",
        description: "Claims Intake sample",
        createdUtc: "2026-01-15T12:00:00.000Z",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
        hasGovernanceWarnings: true,
      };
      listRuns.mockResolvedValue({
        items: [run],
        totalCount: 1,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel(<RunsDashboardPanel hideHeading />);

      await waitFor(() => {
        expect(screen.getByTestId("runs-dashboard-panel")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("runs-dashboard-buyer-proof-summary")).toBeNull();
      expect(screen.queryByTestId("recent-runs-home-panel")).toBeNull();
      expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
    } finally {
      runsDashBuyerPolishedForced.on = false;
      sampleReviewsVisibleMock.value = true;
    }
  });

  it("buyer status pills use the same featured review card UX as All", async () => {
    runsDashBuyerPolishedForced.on = true;

    try {
      const monitoredShowcase: RunSummary = {
        runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
        projectId: "default",
        description: "Claims Intake sample",
        createdUtc: "2026-01-15T12:00:00.000Z",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
        hasGovernanceWarnings: true,
      };
      listRuns.mockResolvedValue({
        items: [monitoredShowcase],
        totalCount: 1,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel();

      expect(await screen.findByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("runs-dashboard-filter-outcomes"));

      const monitoringPanel = await screen.findByTestId("runs-dashboard-panel-outcomes");
      expect(monitoringPanel).toBeInTheDocument();
      expect(monitoringPanel.querySelector('[data-testid="runs-dashboard-buyer-proof-summary"]')).not.toBeNull();
      expect(screen.queryByTestId("runs-dashboard-buyer-outcome-cards")).toBeNull();
      // Zero-count Approved facet is omitted on buyer Overview (empty-count theater).
      expect(screen.queryByTestId("runs-dashboard-filter-approved")).toBeNull();
    } finally {
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("buyer Approved pill shows the same featured card when the sample is clean-approved", async () => {
    runsDashBuyerPolishedForced.on = true;

    try {
      const approvedShowcase: RunSummary = {
        runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
        projectId: "default",
        description: "Claims Intake sample",
        createdUtc: "2026-01-15T12:00:00.000Z",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
        hasGovernanceWarnings: false,
      };
      listRuns.mockResolvedValue({
        items: [approvedShowcase],
        totalCount: 1,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel();

      expect(await screen.findByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("runs-dashboard-filter-approved"));

      const approvedPanel = await screen.findByTestId("runs-dashboard-panel-approved");
      expect(approvedPanel.querySelector('[data-testid="runs-dashboard-buyer-proof-summary"]')).not.toBeNull();
      expect(approvedPanel.querySelector('[data-testid="recent-runs-home-panel"]')).toBeNull();
    } finally {
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("shows example-aware outcome copy when hideHeading and only a showcase sample is listed", async () => {
    runsDashBuyerPolishedForced.on = true;

    try {
      const run: RunSummary = {
        runId: CUSTOMER_INTAKE_SAMPLE_RUN_ID,
        projectId: "default",
        description: "Claims Intake sample",
        createdUtc: "2026-01-15T12:00:00.000Z",
        hasFindingsSnapshot: true,
        hasGoldenManifest: true,
        demoSeededOverviewInject: true,
      };
      listRuns.mockResolvedValue({
        items: [run],
        totalCount: 1,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel(<RunsDashboardPanel hideHeading />);

      expect(await screen.findByTestId("operator-home-recent-reviews-outcome")).toHaveTextContent(
        OPERATOR_HOME_RECENT_REVIEWS_EXAMPLE_ONLY_OUTCOME,
      );
      expect(screen.queryByText("No reviews in this workspace yet.")).toBeNull();
    } finally {
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("shows buyer status filters without zero-count facets when a single review exists", async () => {
    runsDashBuyerPolishedForced.on = true;

    const run: RunSummary = {
      runId: "33333333-3333-3333-3333-333333333333",
      projectId: "default",
      description: "Active review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Filter reviews" })).toBeInTheDocument();
      expect(screen.getByTestId("runs-dashboard-filter-all")).toHaveTextContent("All (1)");
      expect(screen.getByTestId("runs-dashboard-filter-approved")).toHaveTextContent("Approved (1)");
    });

    expect(screen.queryByTestId("runs-dashboard-filter-attention")).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-filter-outcomes")).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-view-all-reviews")).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-show-archived")).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-filters")).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-governance-warnings-only")).toBeNull();

    runsDashBuyerPolishedForced.on = false;
  });

  it("buyer-polished empty state shows workspace empty copy without duplicate onboarding CTAs", async () => {
    runsDashBuyerPolishedForced.on = true;

    const fallbackSpy = vi.spyOn(operatorStaticDemo, "tryStaticDemoRunSummariesPaged").mockReturnValue(null);

    try {
      listRuns.mockResolvedValue({
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 5,
        hasMore: false,
      });
      stubFetchForDashboard();

      renderRunsDashboardPanel();

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-workspace-empty-state")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("runs-dashboard-status-filters")).toBeNull();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_TITLE)).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)),
      ).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "View review" })).toBeNull();
      expect(screen.queryByTestId("example-request-panel")).toBeNull();
    } finally {
      fallbackSpy.mockRestore();
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("buyer-polished archived filter is disabled with zero count when archive field is supported", async () => {
    runsDashBuyerPolishedForced.on = true;

    const run: RunSummary = {
      runId: "33333333-3333-3333-3333-333333333333",
      projectId: "default",
      description: "Active review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: false,
    };
    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    const archivedFilter = await screen.findByTestId("runs-dashboard-show-archived");
    expect(archivedFilter).toHaveTextContent("Archived 0");
    expect(archivedFilter).toBeDisabled();
    expect(screen.queryByTestId("runs-dashboard-open-review-packages")).toBeNull();
    expect(screen.queryByTestId("runs-dashboard-archived-unsupported")).toBeNull();
    expect(screen.queryByText(/contact your administrator/i)).toBeNull();

    runsDashBuyerPolishedForced.on = false;
  });

  it("buyer-polished archived filter lists archived reviews when count is greater than zero", async () => {
    runsDashBuyerPolishedForced.on = true;

    const activeRun: RunSummary = {
      runId: "44444444-4444-4444-4444-444444444444",
      projectId: "default",
      description: "Active review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: false,
    };
    const archivedRun: RunSummary = {
      runId: "55555555-5555-5555-5555-555555555555",
      projectId: "default",
      description: "Archived review",
      createdUtc: "2026-01-10T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: true,
      requestId: "req-archived-1",
    };
    listRuns.mockResolvedValue({
      items: [activeRun, archivedRun],
      totalCount: 2,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    const archivedFilter = await screen.findByTestId("runs-dashboard-show-archived");
    expect(archivedFilter).toHaveTextContent("Archived 1");
    expect(archivedFilter).not.toBeDisabled();

    fireEvent.click(archivedFilter);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Archived review" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("link", { name: "Active review" })).toBeNull();
    expect(screen.queryByTestId("operator-home-workspace-archived-empty-state")).toBeNull();
    expect(screen.queryByText(/contact your administrator/i)).toBeNull();

    runsDashBuyerPolishedForced.on = false;
  });

  it("operator shell exposes tablist with tabpanels and keyboard navigation when reviews exist (TB-667)", async () => {
    const activeRun: RunSummary = {
      runId: "66666666-6666-6666-6666-666666666666",
      projectId: "default",
      description: "Active review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: false,
    };

    listRuns.mockResolvedValue({
      items: [activeRun],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    await screen.findByRole("link", { name: "Active review" });

    await waitFor(() => {
      expect(screen.getByRole("tablist", { name: "Review views" })).toBeInTheDocument();
    });

    expect(screen.getByRole("tab", { name: /recent/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("link", { name: /open all reviews/i })).not.toBeNull();
    expect(screen.getByTestId("runs-dashboard-status-filters").querySelector("a")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /needs attention/i }));

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /needs attention/i })).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByRole("tabpanel")).toHaveAttribute("data-testid", "runs-dashboard-panel-attention");
  });

  it("shows archived empty state when archived filter is active with no matching reviews", async () => {
    const activeRun: RunSummary = {
      runId: "66666666-6666-6666-6666-666666666666",
      projectId: "default",
      description: "Active review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: false,
    };
    const archivedRun: RunSummary = {
      runId: "77777777-7777-7777-7777-777777777777",
      projectId: "default",
      description: "Archived review",
      createdUtc: "2026-01-10T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      isArchived: true,
    };
    listRuns.mockResolvedValue({
      items: [activeRun, archivedRun],
      totalCount: 2,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel();

    await screen.findByRole("link", { name: "Active review" });

    fireEvent.click(screen.getByTestId("runs-dashboard-show-archived"));
    fireEvent.click(screen.getByTestId("runs-dashboard-governance-warnings-only"));

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-workspace-archived-empty-state")).toBeInTheDocument();
    });
    expect(screen.getByText("No archived reviews yet.")).toBeInTheDocument();
    expect(screen.getByText("Archived reviews will appear here.")).toBeInTheDocument();
    expect(screen.queryByTestId("runs-dashboard-archived-unsupported")).toBeNull();
  });

  it("skips client fetch when the server snapshot is fresh enough", async () => {
    const run: RunSummary = {
      runId: "11111111-1111-1111-1111-111111111111",
      projectId: "default",
      description: "Server painted review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    listRuns.mockResolvedValue({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });
    stubFetchForDashboard();

    renderRunsDashboardPanel(
      <RunsDashboardPanel
        hideHeading
        initialModel={buildInitialModel({
          items: [run],
          totalCount: 1,
        })}
      />,
    );

    expect(await screen.findByRole("link", { name: "Server painted review" })).toBeInTheDocument();
    expect(screen.queryByTestId("runs-dashboard-recent-loading")).toBeNull();
    expect(listRuns).not.toHaveBeenCalled();
  });

  it("keeps painted reviews visible during background refresh", async () => {
    const run: RunSummary = {
      runId: "11111111-1111-1111-1111-111111111111",
      projectId: "default",
      description: "Server painted review",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    let resolveFetch: ((value: Awaited<ReturnType<typeof listRunsByProjectPaged>>) => void) | null = null;
    listRuns.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    stubFetchForDashboard();

    renderRunsDashboardPanel(
      <RunsDashboardPanel
        hideHeading
        initialModel={buildInitialModel({
          loadFailure: {
            message: "temporary",
            problem: null,
            correlationId: null,
            httpStatus: 503,
            retryAfterSeconds: null,
          },
          items: [run],
          totalCount: 1,
        })}
      />,
    );

    expect(await screen.findByRole("link", { name: "Server painted review" })).toBeInTheDocument();
    expect(screen.queryByTestId("runs-dashboard-recent-loading")).toBeNull();
    expect(listRuns).toHaveBeenCalledTimes(1);

    resolveFetch?.({
      items: [run],
      totalCount: 1,
      page: 1,
      pageSize: 5,
      hasMore: false,
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Server painted review" })).toBeInTheDocument();
    });
    expect(screen.queryByTestId("runs-dashboard-recent-loading")).toBeNull();
  });
});
