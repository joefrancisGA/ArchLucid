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

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import {
  OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
  OPERATOR_HOME_RECOMMENDED_FIRST_BADGE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
} from "@/lib/buyer-polish-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { REVIEW_START_OPENING_LABEL } from "@/lib/review-start-progress-copy";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";

describe("OperatorHomeDualPathCards", () => {
  it("promises born-governed creation output and marks the review path recommended first", () => {
    render(<OperatorHomeDualPathCards />);

    expect(screen.getByTestId("operator-home-dual-path-chooser-guidance")).toHaveTextContent(
      OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
    );
    expect(screen.getByTestId("operator-home-review-recommended-first")).toHaveTextContent(
      OPERATOR_HOME_RECOMMENDED_FIRST_BADGE,
    );
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
  });

  it("shows immediate loading feedback when starting the review architecture path", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-review-architecture-cta"));

    expect(screen.getByRole("button", { name: REVIEW_START_OPENING_LABEL })).toBeDisabled();
    expect(prefetch).toHaveBeenCalledWith("/reviews/new");
    expect(push).toHaveBeenCalledWith("/reviews/new");
  });
});
