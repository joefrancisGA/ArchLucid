import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_CONTEXTUAL_HELP_TRIGGER_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE,
  FIRST_REVIEW_GUIDE_SOURCES,
} from "@/lib/first-review-guide-evidence-copy";
import {
  FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_TEST_ID,
  FIRST_REVIEW_GUIDE_PRIMARY_CONTENT_ID,
  FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL,
  FIRST_REVIEW_GUIDE_SKIP_TARGET_ID,
} from "@/lib/first-review-guide-page-copy";

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

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: ({ triggerText }: { triggerText?: string }) => (
    <button type="button" data-testid="page-contextual-help-button">
      {triggerText ?? "Help"}
    </button>
  ),
}));

vi.mock("@/components/GettingStartedTrialSection", () => ({
  GettingStartedTrialSection: () => <div data-testid="getting-started-trial-section-stub" />,
}));

vi.mock("./OnboardingOptionalSetupSection", () => ({
  OnboardingOptionalSetupSection: () => <div data-testid="onboarding-optional-setup-section-stub" />,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

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

vi.mock("@/hooks/use-first-review-guide-state", () => ({
  useFirstReviewGuideState: () => loadedGuideState,
}));

import { FirstReviewGuidePageClient } from "./FirstReviewGuidePageClient";

describe("FirstReviewGuidePageClient buyer-polished shell (ARF)", () => {
  it("renders skip link, first-viewport band, orientation above checklist, claim discipline, and Sources links", () => {
    render(<FirstReviewGuidePageClient model={{ fromRegistration: false }} />);

    expect(screen.getByRole("link", { name: FIRST_REVIEW_GUIDE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${FIRST_REVIEW_GUIDE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("first-review-guide-primary-content")).toHaveAttribute(
      "id",
      FIRST_REVIEW_GUIDE_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("first-review-guide-claim-discipline").textContent).toContain(
      FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByText(FIRST_REVIEW_GUIDE_CONTEXTUAL_HELP_TRIGGER_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-sample-review-shortcut")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("first-review-guide-primary-content");
    const firstViewport = screen.getByTestId(FIRST_REVIEW_GUIDE_FIRST_VIEWPORT_TEST_ID);
    const pageHeader = screen.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE });
    const orientationTop = screen.getByTestId("first-review-guide-orientation-top");
    const onboardingProgress = screen.getByTestId("onboarding-progress");
    const sourcesSection = screen.getByTestId("first-review-guide-sources");

    expect(primaryContent).toContainElement(pageHeader);
    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).not.toContainElement(pageHeader);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(onboardingProgress);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(onboardingProgress) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(FIRST_REVIEW_GUIDE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
