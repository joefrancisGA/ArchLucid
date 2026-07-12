import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();
const createNavigate = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
  }),
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
}));

vi.mock("@/components/operator-home/operator-home-workspace-activity-context", () => ({
  useOperatorHomeWorkspaceActivity: () => ({
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

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import {
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_CLOUD_EVIDENCE_LINK,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_READY_STRIP_SUPPORT,
} from "@/lib/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

describe("OperatorHomeDualPathCards", () => {
  it("shows three intent cards with a single evaluation recommendation", () => {
    render(<OperatorHomeDualPathCards />);

    expect(screen.getByTestId("operator-home-explore-recommended-badge")).toHaveTextContent(
      OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
    );
    expect(screen.getByRole("heading", { name: OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE })).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_REVIEW_ARCHITECTURE_CARD_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-optional-cloud-shortcut")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_CLOUD_EVIDENCE_LINK })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_PATH,
    );
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-readiness-strip")).toHaveTextContent(OPERATOR_HOME_READY_STRIP_SUPPORT);
    expect(screen.queryByText(/Recommended first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recommended next/i)).not.toBeInTheDocument();
  });

  it("shows immediate loading feedback when starting the review architecture path", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-review-architecture-cta"));

    expect(screen.getByRole("button", { name: REVIEW_START_LOADING_LABEL })).toBeDisabled();
    expect(prefetch).toHaveBeenCalledWith("/reviews/new");
    expect(push).toHaveBeenCalledWith("/reviews/new");
  });

  it("navigates to the completed review sample from the explore card", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-explore-completed-review-cta"));

    expect(prefetch).toHaveBeenCalledWith(
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(push).toHaveBeenCalledWith(
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
  });

  it("delegates create architecture to the dedicated navigation hook", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-create-architecture-cta"));

    expect(createNavigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("operator-home-review-start-progress")).toBeNull();
  });
});
