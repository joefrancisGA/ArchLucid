import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: () => "/architecture/reviews",
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  };
});

import {
  BUYER_RUNS_LIST_MALFORMED_BODY,
  BUYER_RUNS_LIST_MALFORMED_HEADING,
} from "@/lib/buyer-polish-copy";
import {
  REVIEWS_HUB_LIST_LOAD_FAILURE_TRY_NEXT,
  REVIEWS_HUB_LIST_NOT_FOUND_TRY_NEXT,
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_PRIMARY_START_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
} from "./reviews-hub-copy";
import { RunsPageView } from "./RunsPageView";
import type { RunsPageModel } from "./runs-page-model";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/OperatorPageHeader", () => ({
  OperatorPageHeader: ({
    title,
    subtitle,
    metadata,
    actions,
  }: {
    title: string;
    subtitle?: string;
    metadata?: ReactNode;
    actions?: ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {subtitle ? <p data-testid="runs-page-subtitle">{subtitle}</p> : null}
      {metadata ? <div data-testid="runs-page-metadata">{metadata}</div> : null}
      {actions ? <div data-testid="runs-page-header-actions">{actions}</div> : null}
    </div>
  ),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => [],
  useArchitectureDraftRegistryHydrated: () => true,
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/RunsListProofHeadline", () => ({
  RunsListProofHeadline: () => null,
}));

vi.mock("./ReviewsHubBeforeAfterDeltaPanel", () => ({
  ReviewsHubBeforeAfterDeltaPanel: () => null,
}));

vi.mock("@/components/RunsIndexBeforeAfterPanel", () => ({
  RunsIndexBeforeAfterPanel: () => null,
}));

vi.mock("@/components/RunsListAggregateErrorBoundary", () => ({
  RunsListAggregateErrorBoundary: () => <div data-testid="runs-list-advanced" />,
}));

vi.mock("@/components/OperatorDemoStaticBanner", () => ({
  OperatorDemoStaticBanner: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isBuyerSafeDemoMarketingChromeEnv: () => false,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

function baseModel(overrides: Partial<RunsPageModel> = {}): RunsPageModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 25,
    runs: [],
    totalCount: 0,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    nextCursorForClient: null,
    projectTitle: "Project: default",
    firstCommittedRunId: null,
    welcomeOnboardingEligible: false,
    ...overrides,
  };
}

describe("RunsPageView page chrome", () => {
  it("renders synchronized title and hub subtitle without default project metadata", () => {
    render(<RunsPageView model={baseModel()} />);

    expect(screen.getByRole("heading", { level: 2, name: REVIEWS_HUB_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("runs-page-subtitle")).toHaveTextContent(REVIEWS_HUB_PAGE_SUBTITLE);
    expect(screen.queryByTestId("runs-page-project-label")).toBeNull();
  });

  it("shows project metadata when the workspace project is not the default scope", () => {
    render(
      <RunsPageView
        model={baseModel({
          projectId: "claims-intake",
          projectTitle: "Project: claims-intake",
        })}
      />,
    );

    expect(screen.getByTestId("runs-page-project-label")).toHaveTextContent("Project: claims-intake");
    expect(screen.getByTestId("runs-page-project-label").querySelector("strong")).toHaveTextContent("Project:");
  });

  it("leads with summary and empty inventory state on an empty hub", () => {
    render(<RunsPageView model={baseModel({ totalCount: 0 })} />);

    expect(screen.getByTestId("runs-page-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("runs-page-start-review")).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByTestId("runs-page-start-review")).toHaveTextContent(REVIEWS_HUB_PRIMARY_START_LABEL);
    expect(screen.getByTestId("reviews-hub-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-summary-empty-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-more-ways")).toBeNull();
    expect(screen.queryByTestId("reviews-hub-explore-samples")).toBeNull();
    expect(screen.queryByTestId("reviews-hub-package-includes")).toBeNull();
    expect(screen.getByTestId("reviews-hub-recent-empty")).toBeInTheDocument();
    expect(screen.getByText(REVIEWS_HUB_RECENT_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: REVIEWS_HUB_PRIMARY_START_LABEL }).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole("link", { name: "Create architecture" })).toBeNull();
    expect(screen.queryByTestId("runs-list-advanced")).toBeNull();
    expect(screen.queryByTestId("reviews-hub-resume-drafts")).toBeNull();
  });

  it("puts summary and inventory first and parks samples/includes under a disclosure when reviews exist", () => {
    render(
      <RunsPageView
        model={baseModel({
          totalCount: 1,
          runs: [
            {
              runId: "review-001",
              projectId: "default",
              createdUtc: "2026-01-15T12:00:00.000Z",
              hasFindingsSnapshot: true,
              findingCount: 2,
            } as RunsPageModel["runs"][number],
          ],
        })}
      />,
    );

    expect(screen.getByTestId("reviews-hub-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-packages-table")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-row-review-001")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty")).toBeNull();
    expect(screen.getByTestId("reviews-hub-more-ways")).toBeInTheDocument();
    expect(screen.queryByTestId("runs-list-advanced")).toBeNull();
  });
});

describe("RunsPageView load failure", () => {
  it("avoids connection advice when the list API returns not found", () => {
    render(
      <RunsPageView
        model={baseModel({
          loadFailure: {
            message: "Resource not found",
            problem: { title: "Not Found", errorCode: "RESOURCE_NOT_FOUND", detail: "Missing" },
            correlationId: "corr-404",
            httpStatus: 404,
            retryAfterSeconds: null,
          },
        })}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Not found in this workspace");
    expect(screen.getByText(REVIEWS_HUB_LIST_NOT_FOUND_TRY_NEXT)).toBeInTheDocument();
    expect(screen.queryByText(/Check your connection/i)).not.toBeInTheDocument();
  });

  it("keeps connection advice for non-404 list load failures", () => {
    render(
      <RunsPageView
        model={baseModel({
          loadFailure: {
            message: "Upstream unreachable",
            problem: null,
            correlationId: "corr-502",
            httpStatus: 502,
            retryAfterSeconds: null,
          },
        })}
      />,
    );

    expect(screen.getByText(REVIEWS_HUB_LIST_LOAD_FAILURE_TRY_NEXT)).toBeInTheDocument();
  });
});

describe("RunsPageView malformed response", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("shows buyer-safe copy in production when the reviews list response is malformed", () => {
    process.env.NODE_ENV = "production";

    render(
      <RunsPageView
        model={baseModel({
          malformedMessage: "Expected array at items[] but received object.",
        })}
      />,
    );

    expect(screen.getByText(BUYER_RUNS_LIST_MALFORMED_HEADING)).toBeInTheDocument();
    expect(screen.getByText(BUYER_RUNS_LIST_MALFORMED_BODY)).toBeInTheDocument();
    expect(screen.queryByText(/Expected array at items/)).not.toBeInTheDocument();
    expect(screen.queryByText(/expected paged review summary shape/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-summary-row")).toBeNull();
  });

  it("shows developer diagnostics in development when the reviews list response is malformed", () => {
    process.env.NODE_ENV = "development";

    const diagnostic = "Expected array at items[] but received object.";

    render(
      <RunsPageView
        model={baseModel({
          malformedMessage: diagnostic,
        })}
      />,
    );

    expect(screen.getByText(diagnostic)).toBeInTheDocument();
    expect(screen.getByText(/expected paged review summary shape/i)).toBeInTheDocument();
  });

  it("renders Report problem on malformed reviews hub response (TB-786)", () => {
    process.env.NODE_ENV = "production";

    render(
      <RunsPageView
        model={baseModel({
          malformedMessage: "Expected array at items[] but received object.",
        })}
      />,
    );

    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-summary-row")).toBeNull();
  });

  it("does not render Report problem on benign empty reviews hub", () => {
    render(<RunsPageView model={baseModel({ totalCount: 0 })} />);

    expect(screen.queryByTestId("report-problem-trigger")).not.toBeInTheDocument();
  });
});
