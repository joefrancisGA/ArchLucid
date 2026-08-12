import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { FirstReviewGuidePageClient } from "./FirstReviewGuidePageClient";
import {
  BUYER_ONBOARDING_PAGE_LEAD,
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/operator/OperatorPageContainer", () => ({
  OperatorPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => <div data-testid="getting-started-trial-section-stub" />,
}));

vi.mock("./OnboardingOptionalSetupSection", () => ({
  OnboardingOptionalSetupSection: () => <div data-testid="onboarding-optional-setup-section-stub" />,
}));

vi.mock("@/hooks/use-first-review-guide-state", () => ({
  useFirstReviewGuideState: () => ({
    isPending: false,
    readiness: {
      kind: "ready-to-start",
      headline: "Ready to start",
      detail: "Ready to start — optional workspace setup can be completed later.",
    },
    progress: {
      completedCount: 0,
      totalCount: 7,
      progressFraction: 0,
      summaryLabel: "0 of 7 steps complete",
      currentStepLabel: "Step 1 of 7: Define the architecture",
    },
    steps: [
      {
        index: 0,
        title: "Define the architecture",
        explanation: "Describe the system, business goal, scope, and constraints.",
        status: "not-started",
        statusLabel: "Not started",
        actionLabel: "Start review",
        actionHref: "/architecture/reviews/new",
        isNextStep: true,
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
  }),
}));

describe("FirstReviewGuidePageClient", () => {
  it("shows readiness, walkthrough, and primary review CTAs", () => {
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(BUYER_ONBOARDING_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-readiness")).toHaveTextContent("Ready to start");
    expect(screen.getByRole("heading", { name: FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("first-review-guide-walkthrough")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start first review" })).toHaveAttribute("href", "/architecture/reviews/new");
    expect(screen.getByRole("link", { name: "Explore sample review" })).toHaveAttribute(
      "href",
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
    expect(screen.getByTestId("onboarding-optional-setup-section-stub")).toBeInTheDocument();
  });
});
