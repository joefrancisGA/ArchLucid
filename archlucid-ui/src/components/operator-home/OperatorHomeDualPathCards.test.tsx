import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
  }),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import {
  OPERATOR_HOME_BEST_FOR_EVALUATING_BADGE,
  OPERATOR_HOME_EXPLORE_COMPLETED_REVIEW_TITLE,
  OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_SUPPORT,
} from "@/lib/buyer-polish-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { REVIEW_START_LOADING_LABEL } from "@/lib/review-start-progress-copy";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";
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
    expect(screen.getByTestId("operator-home-dual-path-chooser-guidance")).toHaveTextContent(
      OPERATOR_HOME_REVIEW_ARCHITECTURE_SUPPORT,
    );
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA })).toBeInTheDocument();
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

  it("routes create architecture to guided intake", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-create-architecture-cta"));

    expect(prefetch).toHaveBeenCalledWith(REVIEWS_NEW_GUIDED_INTAKE_HREF);
    expect(push).toHaveBeenCalledWith(REVIEWS_NEW_GUIDED_INTAKE_HREF);
  });
});
