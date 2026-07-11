import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import {
  OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
  OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
  OPERATOR_HOME_RECOMMENDED_FIRST_BADGE,
  OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA,
} from "@/lib/buyer-polish-copy";
import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";

describe("OperatorHomeDualPathCards", () => {
  it("promises born-governed creation output and marks the review path recommended first", () => {
    render(<OperatorHomeDualPathCards />);

    expect(screen.getByTestId("operator-home-dual-path-chooser-guidance")).toHaveTextContent(
      OPERATOR_HOME_DUAL_PATH_CHOOSER_GUIDANCE,
    );
    expect(screen.getByTestId("operator-home-create-architecture-card")).toHaveTextContent(
      OPERATOR_HOME_CREATE_ARCHITECTURE_CARD_BODY,
    );
    expect(screen.getByTestId("operator-home-create-architecture-card")).not.toHaveTextContent(
      "Generate or refine",
    );
    expect(screen.getByTestId("operator-home-review-recommended-first")).toHaveTextContent(
      OPERATOR_HOME_RECOMMENDED_FIRST_BADGE,
    );
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute(
      "href",
      REVIEWS_NEW_GUIDED_INTAKE_HREF,
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_ARCHITECTURE_CTA })).toBeInTheDocument();
  });
});
