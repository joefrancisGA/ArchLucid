import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { FirstReviewGuidePageClient } from "./FirstReviewGuidePageClient";
import {
  BUYER_ONBOARDING_PAGE_LEAD,
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER } from "@/lib/first-review-guide-evidence-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <button type="button" data-testid="page-contextual-help-button">{triggerText ?? "Help"}</button>
  ),
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => <div data-testid="getting-started-trial-section-stub" />,
}));

vi.mock("./OnboardingOptionalSetupSection", () => ({
  OnboardingOptionalSetupSection: () => <div data-testid="onboarding-optional-setup-section-stub" />,
}));

vi.mock("@/components/FirstReviewGuideFirstArchitectureReviewVocabularyRail", () => ({
  FirstReviewGuideFirstArchitectureReviewVocabularyRail: () => (
    <div data-testid="first-review-guide-vocabulary-rail-stub" />
  ),
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

  it("shows readiness, walkthrough, evaluation scope, and bounded start-review CTAs when loaded", () => {
    mockUseFirstReviewGuideState.mockReturnValue(loadedGuideState);
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(BUYER_ONBOARDING_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-readiness")).toHaveTextContent("Ready to start");
    expect(screen.getByTestId("first-review-guide-readiness")).toHaveTextContent(
      "Optional workspace setup can be completed later.",
    );
    expect(screen.getByTestId("first-review-guide-evaluation-scope")).toHaveTextContent(
      FIRST_REVIEW_GUIDE_EVALUATION_SCOPE_HELPER,
    );
    expect(screen.getByRole("heading", { name: FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-walkthrough")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(PAGE_HELP_SHORT_TRIGGER_TEXT);
    expect(screen.queryByTestId("first-review-guide-vocabulary-rail-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("first-review-guide-header-loading")).not.toBeInTheDocument();

    const startReviewLinks = screen.getAllByRole("link", { name: /start review/i });
    expect(startReviewLinks.length).toBeLessThanOrEqual(2);

    expect(screen.getByRole("link", { name: "Start first review" })).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByRole("link", { name: "Explore sample review" })).toHaveAttribute(
      "href",
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
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
});
