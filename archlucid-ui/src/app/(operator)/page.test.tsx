import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const listRunsByProjectPaged = vi.fn();
const getPilotScorecard = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

vi.mock("@/components/TrialWelcomeRunDeepLink", () => ({
  TrialWelcomeRunDeepLink: () => null,
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/OperatorHomeGate", () => ({
  OperatorHomeGate: ({ children }: { children: import("react").ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
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

vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator-static-demo")>();

  return {
    ...actual,
    tryStaticDemoRunSummariesPaged: vi.fn(() => null),
  };
});

vi.mock("@/components/cto-demo/CtoDemoResetButton", () => ({
  CtoDemoResetButton: () => (
    <button type="button" data-testid="cto-demo-reset-button-mock">
      Reset demo
    </button>
  ),
}));

vi.mock("@/components/operator-home/OperatorHomeAdvancedGuidancePanel", () => ({
  OperatorHomeAdvancedGuidancePanel: () => <div data-testid="operator-home-advanced-guidance" />,
}));

vi.mock("@/components/cto-demo/CtoDemoExecutiveLandingRedirect", () => ({
  CtoDemoExecutiveLandingRedirect: () => null,
}));

const useFeaturedCompletedSampleQuery = vi.fn();

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => useFeaturedCompletedSampleQuery(),
}));

vi.mock("./_sections/load-operator-home-runs-dashboard-model", () => ({
  loadOperatorHomeRunsDashboardModel: vi.fn(),
}));

import HomePage from "./page";
import { loadOperatorHomeRunsDashboardModel } from "./_sections/load-operator-home-runs-dashboard-model";
import type { OperatorHomeRunsDashboardModel } from "./_sections/operator-home-runs-dashboard-model";
import type { RunSummary } from "@/types/authority";

const mockLoadOperatorHomeRunsDashboardModel = vi.mocked(loadOperatorHomeRunsDashboardModel);

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
  const page = await HomePage();

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

  it("keeps the home launchpad focused on dual-path hero, workspace activity, explore sample, and collapsed setup section", async () => {
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
    await waitFor(() => {
      expect(screen.getByTestId("operator-home-advanced-guidance")).toBeInTheDocument();
    });
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

  it("renders dual-path hero, workspace activity, consolidated explore sample section, and collapsed setup section", async () => {
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
      "/reviews/new?template=claims-intake-modernization",
    );
    expect(screen.getByRole("link", { name: "Run guided review" })).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-explore-open-completed-sample")).toBeNull();
    expect(screen.getByRole("link", { name: "Open review" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("operator-home-advanced-guidance")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("operator-home-workspace-context")).not.toBeInTheDocument();
    expect(screen.queryByText("ROI estimate pending")).toBeNull();
    expect(screen.queryByText("Advanced Analysis")).toBeNull();
  });

  it("exposes create and review CTAs from the dual-path hero", async () => {
    await renderHomePage();

    expect(screen.getByRole("button", { name: "Create architecture" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Run guided review" })).toBeInTheDocument();
  });

  it("exposes primary workflow destinations matching shell review paths", async () => {
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
      expect(screen.getByRole("link", { name: "Open all reviews" })).toHaveAttribute(
        "href",
        "/reviews?projectId=default",
      );
    });
  });
});
