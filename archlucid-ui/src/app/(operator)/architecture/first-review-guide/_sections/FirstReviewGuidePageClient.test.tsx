import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { FirstReviewGuidePageClient } from "./FirstReviewGuidePageClient";
import {
  BUYER_ONBOARDING_PAGE_LEAD,
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE,
  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID,
  FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL,
  FIRST_REVIEW_GUIDE_SKIP_TARGET_ID,
} from "@/lib/first-review-guide-page-copy";
import { FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID } from "@/lib/first-review-guide-route";
import { FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE, FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER } from "@/lib/first-review-guide-evidence-copy";
import * as scrollDeepLink from "@/lib/scroll-deep-link-target-into-view";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => <div data-testid="getting-started-trial-section-stub" />,
}));

vi.mock("./OnboardingOptionalSetupSection", () => ({
  OnboardingOptionalSetupSection: () => <div data-testid="onboarding-optional-setup-section-stub" />,
}));

const loadedGuideState = {
  hasLoadedContext: true,
  isPending: false,
  isError: false,
  errorMessage: null,
  retry: vi.fn(),
  readiness: {
    kind: "ready-to-start" as const,
    headline: "Ready to start",
    detail: "Optional workspace setup can be completed later.",
  },
  progress: {
    phase: "not-started" as const,
    progressFraction: 0,
    summaryLabel: "Not started",
    detailLabel: "Begin with step 1 when you are ready.",
    completedStepCount: 0,
    totalStepCount: 7,
  },
  steps: [
    {
      index: 0,
      title: "Define the architecture",
      explanation: "Describe the system, business goal, scope, and constraints.",
      status: "not-started" as const,
      statusLabel: "Not started",
      actionLabel: "Start review",
      actionHref: "/architecture/reviews/new",
      isNextStep: true,
    },
    {
      index: 1,
      title: "Add requirements and evidence",
      explanation: "Provide the documents, decisions, and context the review should evaluate.",
      status: "not-started" as const,
      statusLabel: "Not started",
      actionLabel: "Open evidence intake",
      actionHref: "/architecture/reviews/new?path=guided-intake",
      isNextStep: false,
    },
  ],
  headerActions: {
    primaryLabel: "Start first review",
    primaryHref: "/architecture/reviews/new",
    primaryDisabled: false,
    primaryDisabledReason: null,
    secondaryLabel: "Explore sample review",
    secondaryHref: `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
  },
  requiredBlockers: [],
  canExecute: true,
  readyToFinalize: false,
  latestRunHref: null,
  hasCommittedManifest: false,
  sealedReviewRecord: null,
};

const mockUseFirstReviewGuideState = vi.fn(() => loadedGuideState);

vi.mock("@/hooks/use-first-review-guide-state", () => ({
  useFirstReviewGuideState: () => mockUseFirstReviewGuideState(),
}));

describe("FirstReviewGuidePageClient", () => {
  it("uses workflow container left-aligned without mx-auto", () => {
    mockUseFirstReviewGuideState.mockReturnValue(loadedGuideState);
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    const surface = screen.getByTestId("first-review-guide-page");
    expect(surface).toHaveClass("w-full", "max-w-[1200px]");
    expect(surface.className).not.toMatch(/mx-auto/);
  });

  it("places the support panel beside the checklist in a two-column layout at lg+", () => {
    mockUseFirstReviewGuideState.mockReturnValue(loadedGuideState);
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    const supportPanel = screen.getByTestId("first-review-guide-support-panel");
    const firstViewport = screen.getByTestId(FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID);
    const layoutGrid = firstViewport.closest(".lg\\:grid-cols-\\[minmax\\(0\\,1fr\\)_minmax\\(260px\\,320px\\)\\]");

    expect(layoutGrid).not.toBeNull();
    expect(layoutGrid).toContainElement(firstViewport);
    expect(layoutGrid).toContainElement(supportPanel);
    expect(supportPanel).toHaveClass("lg:sticky", "lg:top-4");
  });

  it("shows readiness, walkthrough, evaluation scope, and bounded start-review CTAs when loaded", () => {
    mockUseFirstReviewGuideState.mockReturnValue(loadedGuideState);
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(BUYER_ONBOARDING_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${FIRST_REVIEW_GUIDE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID)).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-readiness")).toHaveTextContent("Ready to start");
    expect(screen.getByTestId("first-review-guide-readiness")).toHaveTextContent(
      "Optional workspace setup can be completed later.",
    );
    expect(screen.getByTestId("first-review-guide-evaluation-scope")).toHaveTextContent(
      FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER,
    );
    expect(screen.queryByTestId("first-review-guide-help-crosslink")).not.toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-orientation")).toBeInTheDocument();
    expect(screen.queryByText(FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-walkthrough")).toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-header-loading")).not.toBeInTheDocument();

    const firstViewport = screen.getByTestId(FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_ID);
    const orientationStrip = screen.getByTestId("first-review-guide-orientation");

    expect(
      firstViewport.compareDocumentPosition(orientationStrip) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const startReviewLinks = screen.getAllByRole("link", { name: /start review/i });
    expect(startReviewLinks.length).toBeLessThanOrEqual(2);

    expect(screen.getByRole("link", { name: "Start first review" })).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByRole("link", { name: "Explore sample review" })).toHaveAttribute(
      "href",
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );

    const primaryAction = screen.getByTestId("first-review-guide-primary");
    const secondaryAction = screen.getByTestId("first-review-guide-secondary");
    expect(primaryAction).toHaveClass("h-9");
    expect(secondaryAction).toHaveClass("h-9");
    expect(secondaryAction).not.toHaveClass("h-7");

    expect(screen.queryByTestId("first-review-guide-next-action-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("onboarding-optional-setup-section-stub")).toBeInTheDocument();
  });

  it("shows loading skeletons while commit context is pending", () => {
    mockUseFirstReviewGuideState.mockReturnValue({
      ...loadedGuideState,
      hasLoadedContext: false,
      isPending: true,
      steps: [],
      readiness: {
        kind: "ready-to-start" as const,
        headline: "Loading review progress",
        detail: null,
      },
    });
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.getByTestId("first-review-guide-header-loading")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-progress-loading")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-walkthrough-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-readiness")).not.toBeInTheDocument();
    expect(screen.queryByText("Ready to start")).not.toBeInTheDocument();
  });

  it("shows error callout and retry when commit context fails", () => {
    const retry = vi.fn();
    mockUseFirstReviewGuideState.mockReturnValue({
      ...loadedGuideState,
      hasLoadedContext: false,
      isPending: false,
      isError: true,
      errorMessage: "Could not load review progress from your workspace.",
      retry,
      steps: [],
    });
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.getByTestId("first-review-guide-context-error")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-retry")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-progress-unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-walkthrough-unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-readiness")).not.toBeInTheDocument();
  });

  it("shows sealed-record provenance and hides the sample banner after completion", () => {
    mockUseFirstReviewGuideState.mockReturnValue({
      ...loadedGuideState,
      readiness: {
        kind: "completed" as const,
        headline: "First review completed",
        detail: "Your finalized architecture review is ready to inspect and share.",
      },
      progress: {
        phase: "complete" as const,
        progressFraction: 1,
        summaryLabel: FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE,
        detailLabel: null,
        completedStepCount: 7,
        totalStepCount: 7,
      },
      steps: [
        {
          index: 0,
          title: "Define the architecture",
          explanation: "Describe the system, business goal, scope, and constraints.",
          status: "complete" as const,
          statusLabel: "Complete",
          actionLabel: null,
          actionHref: null,
          isNextStep: false,
        },
      ],
      headerActions: {
        primaryLabel: "Open sealed review record",
        primaryHref: "/architecture/reviews/run-sealed",
        primaryDisabled: false,
        primaryDisabledReason: null,
        secondaryLabel: "Start another review",
        secondaryHref: "/architecture/reviews/new",
      },
      hasCommittedManifest: true,
      sealedReviewRecord: {
        runId: "run-sealed",
        displayName: "Payments platform",
        finalizedOnUtc: "2026-04-15T12:00:00.000Z",
        finalizedByUserId: "user-1",
      },
    });
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.queryByTestId("first-review-guide-readiness")).not.toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-completed-message")).toHaveTextContent(
      FIRST_REVIEW_GUIDE_COMPLETED_MESSAGE,
    );
    expect(screen.getByTestId("first-review-guide-sealed-record-provenance")).toHaveTextContent("Payments platform");
    expect(screen.getByTestId("first-review-guide-sealed-record-provenance")).toHaveTextContent("Apr 15, 2026");
    expect(screen.queryByTestId("first-review-guide-evaluation-scope")).not.toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-sample-review-shortcut")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open sealed review record" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-sealed",
    );
    expect(screen.getByRole("link", { name: "Start another review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByTestId("first-review-guide-walkthrough-completed-summary")).toBeInTheDocument();
    expect(screen.queryByText(/7 of 7 steps complete/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-walkthrough")).not.toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-orientation")).toBeInTheDocument();
  });

  it("scrolls the walkthrough progress section when the onboarding checklist hash is active", () => {
    const scheduleScroll = vi.spyOn(scrollDeepLink, "scheduleScrollDeepLinkTargetIntoView");
    window.location.hash = `#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`;
    mockUseFirstReviewGuideState.mockReturnValue(loadedGuideState);

    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(scheduleScroll).toHaveBeenCalledWith(FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID);
  });
});
