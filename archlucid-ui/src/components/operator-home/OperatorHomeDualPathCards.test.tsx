import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

const push = vi.fn();
const prefetch = vi.fn();
const createNavigate = vi.fn();

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
    context: {
      healthReady: true,
      healthLoadFailed: false,
      principalAdmin: true,
    },
    readyCount: 4,
    totalCount: 4,
  }),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 100,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 100,
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
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_CLOUD_EVIDENCE_LINK,
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_TITLE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_READY_TO_BEGIN_TITLE,
} from "@/lib/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import { featuredCompletedSampleReviewHref } from "@/lib/fetch-tenant-homepage-settings-client";

const featuredSampleRunId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

describe("OperatorHomeDualPathCards", () => {
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
    expect(screen.getByTestId("operator-home-optional-cloud-shortcut")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_CLOUD_EVIDENCE_LINK })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_PATH,
    );
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-readiness-strip")).toHaveTextContent(OPERATOR_HOME_READY_TO_BEGIN_TITLE);
    expect(screen.getByTestId("operator-home-readiness-strip")).not.toHaveTextContent("Workspace configured");
    expect(screen.queryByText(/Recommended first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recommended next/i)).not.toBeInTheDocument();
  });

  it("emphasizes the review card when requested", () => {
    render(<OperatorHomeDualPathCards emphasizedPath="review-architecture" />);

    expect(screen.getByTestId("operator-home-lifecycle-recommended-review-architecture")).toHaveTextContent(
      "Recommended next",
    );
    expect(screen.queryByTestId("operator-home-explore-recommended-badge")).toBeNull();
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

  it("uses compact variant without the readiness strip", () => {
    render(<OperatorHomeDualPathCards variant="compact" />);

    expect(screen.getByTestId("operator-home-dual-path-cards")).toHaveAttribute("data-variant", "compact");
    expect(screen.queryByTestId("operator-home-readiness-strip")).toBeNull();
    expect(screen.queryByTestId("operator-home-explore-recommended-badge")).toBeNull();
  });

  it("delegates create architecture to the dedicated navigation hook", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-create-architecture-cta"));

    expect(createNavigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("operator-home-review-start-progress")).toBeNull();
  });
});
