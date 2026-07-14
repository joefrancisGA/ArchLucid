import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BUYER_RUNS_LIST_MALFORMED_BODY,
  BUYER_RUNS_LIST_MALFORMED_HEADING,
} from "@/lib/buyer-polish-copy";
import { REVIEWS_HUB_PAGE_SUBTITLE, REVIEWS_HUB_PAGE_TITLE, REVIEWS_HUB_PRIMARY_START_LABEL, REVIEWS_HUB_RECENT_EMPTY_TITLE } from "./reviews-hub-copy";
import { RunsPageView } from "./RunsPageView";
import type { RunsPageModel } from "./runs-page-model";

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
  }: {
    title: string;
    subtitle?: string;
    metadata?: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p data-testid="runs-page-subtitle">{subtitle}</p> : null}
      {metadata ? <div data-testid="runs-page-metadata">{metadata}</div> : null}
    </div>
  ),
}));

vi.mock("@/components/OperatorWelcomeOnboarding", () => ({
  OperatorWelcomeOnboarding: () => null,
}));

vi.mock("@/components/RunsListProofHeadline", () => ({
  RunsListProofHeadline: () => null,
}));

vi.mock("@/components/BeforeAfterDeltaPanel", () => ({
  BeforeAfterDeltaPanel: () => null,
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

vi.mock("./ReviewsHubPrimaryActions", async () => {
  const actual = await vi.importActual<typeof import("./ReviewsHubPrimaryActions")>("./ReviewsHubPrimaryActions");

  return actual;
});

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

    expect(screen.getByRole("heading", { level: 1, name: REVIEWS_HUB_PAGE_TITLE })).toBeInTheDocument();
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

  it("renders hub summary, actions, includes, and intentional empty recent section", () => {
    render(<RunsPageView model={baseModel({ totalCount: 0 })} />);

    expect(screen.getByTestId("reviews-hub-summary-row")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-summary-empty-hint")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-primary-actions")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-explore-samples")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-package-includes")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-recent-empty")).toBeInTheDocument();
    expect(screen.getByText(REVIEWS_HUB_RECENT_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("runs-page-start-review")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("runs-page-start-review")).toHaveTextContent(REVIEWS_HUB_PRIMARY_START_LABEL);
    expect(screen.getByTestId("reviews-hub-recent-empty-start-review")).toHaveTextContent(REVIEWS_HUB_PRIMARY_START_LABEL);
    expect(screen.queryByRole("link", { name: "Create architecture" })).toBeNull();
    expect(screen.queryByTestId("runs-list-advanced")).toBeNull();
  });

  it("renders recent package rows when packages exist", () => {
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

    expect(screen.getByTestId("reviews-hub-packages-table")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-row-review-001")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty")).toBeNull();
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
});
