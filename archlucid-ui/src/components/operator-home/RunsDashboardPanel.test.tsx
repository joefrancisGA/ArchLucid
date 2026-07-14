import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    listRunsByProjectPaged: vi.fn(),
    restoreArchitectureRequest: vi.fn(),
  };
});

const runsDashBuyerPolishedForced = vi.hoisted(() => ({ on: false as boolean }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => runsDashBuyerPolishedForced.on,
  };
});

import { listRunsByProjectPaged } from "@/lib/api";
import { BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA, OPERATOR_HOME_WORKSPACE_EMPTY_BODY, OPERATOR_HOME_WORKSPACE_EMPTY_TITLE } from "@/lib/buyer-polish-copy";
import * as operatorStaticDemo from "@/lib/operator-static-demo";

import { OperatorHomeWorkspaceActivityProvider } from "@/components/operator-home/operator-home-workspace-activity-context";

import { RunsDashboardPanel } from "./RunsDashboardPanel";

import type { RunSummary } from "@/types/authority";

const listRuns = vi.mocked(listRunsByProjectPaged);

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
    expect(link).toHaveAttribute("href", "/reviews/11111111-1111-1111-1111-111111111111");
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
    expect(screen.getByText("4 findings")).toBeInTheDocument();
    expect(screen.getByTestId("run-governance-warning-indicator")).toBeInTheDocument();
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
      expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)).toBeInTheDocument();
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

  it("shows pipeline status for runs needing attention tab", async () => {
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
      await screen.findByLabelText(/Review status: Needs attention/i),
    ).toBeInTheDocument();
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

  it("shows governance warning indicator when run hasGovernanceWarnings is true", async () => {
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

    expect(await screen.findByTestId("run-governance-warning-indicator")).toBeInTheDocument();
  });

  it("buyer-polished recent tab features sample review, omits showcase banner, and hides full list when only sample run", async () => {
    runsDashBuyerPolishedForced.on = true;

    try {
      const run: RunSummary = {
        runId: "claims-intake-modernization",
        projectId: "default",
        description: "Claims Intake sample",
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
        expect(screen.getByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();
      });
      expect(screen.getByTestId("runs-dashboard-buyer-proof-summary")).toBeInTheDocument();
      expect(screen.getByText("Decision: Package finalized")).toBeInTheDocument();
      expect(screen.queryByTestId("operator-home-showcase-demo-banner")).toBeNull();
      expect(screen.queryByRole("link", { name: "Jump to review journey" })).toBeNull();
      expect(screen.getByRole("link", { name: "Claims Intake Modernization Review" })).toHaveAttribute(
        "href",
        "/reviews/claims-intake-modernization",
      );
      expect(screen.queryByRole("link", { name: "Signed manifest summary" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Full review detail" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Open all reviews" })).toBeNull();
      expect(screen.queryByRole("link", { name: "All" })).toBeNull();
    } finally {
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("uses buyer-polished tab labels with stable test ids when reviews exist (TB-352)", async () => {
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
      expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("data-testid", "runs-dashboard-tab-all");
      expect(screen.getByRole("tab", { name: "Approved" })).toHaveAttribute("data-testid", "runs-dashboard-tab-approved");
      expect(screen.getByRole("tab", { name: "Action needed" })).toHaveAttribute(
        "data-testid",
        "runs-dashboard-tab-attention",
      );
      expect(screen.getByRole("tab", { name: "Approved with monitoring" })).toHaveAttribute(
        "data-testid",
        "runs-dashboard-tab-outcomes",
      );
      expect(screen.queryByTestId("runs-dashboard-view-all-reviews")).toBeNull();
      expect(screen.queryByTestId("runs-dashboard-show-archived")).toBeNull();
      expect(screen.queryByTestId("runs-dashboard-open-all-reviews")).toBeNull();
      expect(screen.queryByRole("link", { name: "All" })).toBeNull();
    });
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
      expect(screen.getByText(OPERATOR_HOME_WORKSPACE_EMPTY_BODY)).toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: BUYER_RUNS_DASHBOARD_OPEN_REVIEW_PACKAGES_CTA })).toHaveAttribute(
      "data-testid",
      "runs-dashboard-open-review-packages",
    );
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
});
