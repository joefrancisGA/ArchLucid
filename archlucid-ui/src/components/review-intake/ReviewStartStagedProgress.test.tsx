import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewStartStagedProgress } from "@/components/review-intake/ReviewStartStagedProgress";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import { resolveReviewStartStages } from "@/lib/review-start-progress-stages";

describe("ReviewStartStagedProgress", () => {
  it("renders honest stage labels without a percentage bar", () => {
    render(
      <ReviewStartStagedProgress
        stages={resolveReviewStartStages(true)}
        activeStageId="preparing-questions"
        headline={REVIEW_START_PREPARING_LABEL}
      />,
    );

    expect(screen.getByText(/Creating review workspace/)).toBeInTheDocument();
    expect(screen.getByText(/Applying the selected template/)).toBeInTheDocument();
    expect(screen.getByText(/Preparing review questions/)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
