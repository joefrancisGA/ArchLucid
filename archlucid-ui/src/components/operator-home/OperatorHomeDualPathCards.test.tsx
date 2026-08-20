import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const push = vi.fn();
const prefetch = vi.fn();
const createNavigate = vi.fn();

const UNBLOCKED_SETUP_CONTEXT = {
  healthReady: true,
  healthLoadFailed: false,
  principalAdmin: true,
} as const;

// Hoisted so the vi.mock factory below (which vitest lifts above imports) can read the current value.
const setupReadiness = vi.hoisted(() => ({
  context: { healthReady: true, healthLoadFailed: false, principalAdmin: true },
}));

const callerAuthorityRank = vi.hoisted(() => ({ value: 100 }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
  }),
  usePathname: () => "/",
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => ({
    phase: "ready",
    context: setupReadiness.context,
    readyCount: 4,
    totalCount: 4,
  }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => callerAuthorityRank.value,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: callerAuthorityRank.value,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: callerAuthorityRank.value,
    isAuthorityLoading: false,
  }),}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
    openFindingsCount: 0,
    recentRunIds: [],
    hasWorkspaceReviews: false,
    hasActionNeededReviews: false,
    reportWorkspaceReviews: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: (input: { href: string }) => {
      void prefetch(input.href);
      push(input.href);
    },
    reset: vi.fn(),
    isNavigating: true,
    isPending: true,
    activeStageId: "opening-review",
    showStagedPanel: false,
    stages: [],
    loadingLabel: "Starting review…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate: createNavigate,
    reset: vi.fn(),
    isNavigating: false,
    loadingLabel: "Starting architecture…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: () => ({
    isPending: false,
    isError: false,
    data: {
      selectedRunId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      isConfigured: true,
      isAvailable: true,
      reviewTitle: "Claims intake modernization",
      architectureName: "Claims intake modernization",
      completedUtc: "2026-01-01T00:00:00.000Z",
      isSampleApproved: true,
    },
  }),
}));

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import {
  OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO,
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_CLOUD_CONNECT_ADMIN_HINT,
  OPERATOR_HOME_CONNECT_CLOUD_CTA,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";

const featuredSampleRunId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

describe("OperatorHomeDualPathCards", () => {
  beforeEach(() => {
    setupReadiness.context = { ...UNBLOCKED_SETUP_CONTEXT };
    callerAuthorityRank.value = 100;
  });

  it("shows lifecycle steps plus an evaluation explore card", () => {
    render(<OperatorHomeDualPathCards emphasizedPath="explore-completed-review" />);

    // Page subtitle owns the one-lifecycle line; dual-path cards must not repeat it.
    expect(screen.queryByText(OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO)).toBeNull();
    expect(screen.getByTestId("operator-home-explore-recommended-badge")).toHaveTextContent(
      OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
    );
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-connect-cloud-path")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_CONNECT_CLOUD_CTA })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_PATH,
    );
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toHaveClass("border-neutral-300");
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toHaveClass("border-neutral-300");
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );
    // Unblocked workspaces show no readiness affordance — only blockers are worth a line.
    expect(screen.queryByTestId("operator-home-readiness-strip")).toBeNull();
    expect(screen.queryByTestId("operator-home-readiness-blocker")).toBeNull();
    expect(screen.queryByText(OPERATOR_HOME_READY_TO_BEGIN_TITLE)).toBeNull();
    expect(screen.queryByText(/Recommended first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recommended next/i)).not.toBeInTheDocument();
  });

  it("emphasizes the review card when requested", () => {
    render(<OperatorHomeDualPathCards emphasizedPath="review-architecture" />);

    expect(screen.getByTestId("operator-home-lifecycle-recommended-review-architecture")).toHaveTextContent(
      "Recommended next",
    );
    expect(screen.queryByTestId("operator-home-explore-recommended-badge")).toBeNull();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toHaveClass(
      "bg-[var(--al-primary-action-bg)]",
    );
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toHaveClass("border-neutral-300");
  });

  it("shows immediate loading feedback when starting the review architecture path", () => {
    render(<OperatorHomeDualPathCards emphasizedPath="review-architecture" />);

    expect(screen.getByTestId("operator-home-review-architecture-specimen-preview")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("operator-home-review-architecture-cta"));

    expect(screen.getByRole("button", { name: REVIEW_START_LOADING_LABEL })).toBeDisabled();
    expect(prefetch).toHaveBeenCalledWith("/architecture/reviews/new");
    expect(push).toHaveBeenCalledWith("/architecture/reviews/new");
  });

  it("navigates to the workspace featured completed sample from the explore card", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-explore-completed-review-cta"));

    expect(prefetch).toHaveBeenCalledWith(featuredCompletedSampleReviewHref(featuredSampleRunId));
    expect(push).toHaveBeenCalledWith(featuredCompletedSampleReviewHref(featuredSampleRunId));
  });

  it("uses compact variant without readiness clutter", () => {
    render(<OperatorHomeDualPathCards variant="compact" />);

    expect(screen.getByTestId("operator-home-dual-path-cards")).toHaveAttribute("data-variant", "compact");
    expect(screen.queryByTestId("operator-home-readiness-strip")).toBeNull();
    expect(screen.queryByTestId("operator-home-readiness-blocker")).toBeNull();
    expect(screen.queryByTestId("operator-home-explore-recommended-badge")).toBeNull();
  });

  it("still names a blocking prerequisite in the compact variant", () => {
    setupReadiness.context = { ...UNBLOCKED_SETUP_CONTEXT, principalAdmin: false };

    render(<OperatorHomeDualPathCards variant="compact" />);

    expect(screen.getByTestId("operator-home-readiness-blocker")).toHaveTextContent(
      OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    );
  });

  it("delegates create architecture to the dedicated navigation hook", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-create-architecture-cta"));

    expect(createNavigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("operator-home-review-start-progress")).toBeNull();
  });

  it("shows connect cloud on Step 1 for non-admin operators with an admin hint", () => {
    callerAuthorityRank.value = 2;

    render(<OperatorHomeDualPathCards />);

    expect(screen.getByTestId("operator-home-connect-cloud-path")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_CONNECT_CLOUD_CTA })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_PATH,
    );
    expect(screen.getByText(OPERATOR_HOME_CLOUD_CONNECT_ADMIN_HINT)).toBeInTheDocument();
  });

  it("demotes all lifecycle card primaries when another surface owns the page primary", () => {
    render(<OperatorHomeDualPathCards emphasizedPath="review-architecture" pagePrimaryOwnedElsewhere />);

    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toHaveClass("border-neutral-300");
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toHaveClass("border-neutral-300");
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toHaveClass("border-neutral-300");
  });
});
