import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    isBuyerPolishedOperatorShellEnv: () =>
      runsDashBuyerPolishedForced.on ? true : actual.isBuyerPolishedOperatorShellEnv(),
  };
});

import { listRunsByProjectPaged } from "@/lib/api";
import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_QUERY_VALUE,
} from "@/lib/operator-home-example-request";
import * as operatorStaticDemo from "@/lib/operator-static-demo";

import { RunsDashboardPanel } from "./RunsDashboardPanel";

import type { RunSummary } from "@/types/authority";

const listRuns = vi.mocked(listRunsByProjectPaged);

const originalFetch = globalThis.fetch;

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

    render(<RunsDashboardPanel />);

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

    render(<RunsDashboardPanel />);

    expect(await screen.findByTestId("recent-runs-home-panel")).toBeInTheDocument();
    const link = await screen.findByRole("link", { name: "Sample" });
    expect(link).toHaveAttribute("href", "/reviews/11111111-1111-1111-1111-111111111111");
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

      render(<RunsDashboardPanel />);

      await waitFor(() => {
        expect(screen.getByTestId("operator-home-azure-extractor-empty-state")).toBeInTheDocument();
      });
      expect(
        screen.getByText(/Import your Azure environment to get started/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Create your first request" })).toHaveAttribute("href", "/reviews/new");
      expect(screen.getByRole("link", { name: "Open Azure Extractor settings" })).toHaveAttribute("href", "/settings/tenant");
      expect(screen.getByRole("link", { name: "First-review checklist" })).toHaveAttribute("href", "/onboarding");
      expect(screen.getByTestId("example-request-panel")).toBeInTheDocument();
      expect(screen.getByText(OPERATOR_HOME_EXAMPLE_DESCRIPTION)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Use this example" })).toHaveAttribute(
        "href",
        `/reviews/new?example=${encodeURIComponent(OPERATOR_HOME_EXAMPLE_QUERY_VALUE)}`,
      );
      expect(screen.getByRole("link", { name: "See completed output" })).toHaveAttribute(
        "href",
        "/reviews?projectId=default",
      );
    } finally {
      fallbackSpy.mockRestore();
    }
  });

  it("handles runs list API errors in the recent tab", async () => {
    const fallbackSpy = vi.spyOn(operatorStaticDemo, "tryStaticDemoRunSummariesPaged").mockReturnValue(null);

    try {
      listRuns.mockRejectedValue(new Error("runs unavailable"));
      stubFetchForDashboard();

      render(<RunsDashboardPanel />);

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

    render(<RunsDashboardPanel />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /needs attention/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("tab", { name: /needs attention/i }));

    expect(
      await screen.findByLabelText(/Architecture review pipeline status: Ready to finalize/i),
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

    render(<RunsDashboardPanel />);

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

    render(<RunsDashboardPanel />);

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

      render(<RunsDashboardPanel />);

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
      expect(screen.queryByRole("link", { name: "Open full reviews list" })).toBeNull();
    } finally {
      runsDashBuyerPolishedForced.on = false;
    }
  });

  it("buyer-polished empty state links sample preview to manifest summary", async () => {
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

      render(<RunsDashboardPanel />);

      await waitFor(() => {
        expect(screen.getByTestId("operator-home-getting-started")).toBeInTheDocument();
      });
      expect(
        screen.getByText(/open the full review package above to walk a governed claims intake review end to end/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "View review package" })).toHaveAttribute(
        "href",
        "/reviews/claims-intake-modernization",
      );
      expect(screen.queryByRole("link", { name: "Start executive review" })).toBeNull();
      expect(screen.queryByRole("link", { name: "View signed manifest" })).toBeNull();
      expect(screen.queryByTestId("example-request-panel")).toBeNull();
    } finally {
      fallbackSpy.mockRestore();
      runsDashBuyerPolishedForced.on = false;
    }
  });
});
