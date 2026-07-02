import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeFirstReviewPathStrip } from "@/components/operator-home/OperatorHomeFirstReviewPathStrip";
import {
  OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_HEADING,
  PILOT_PATH_PREVIEW_STEPS,
} from "@/lib/buyer-polish-copy";

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => false),
}));

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";

describe("OperatorHomeFirstReviewPathStrip", () => {
  it("renders the five-step first-hour path before the first committed review", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<OperatorHomeFirstReviewPathStrip />);

    expect(screen.getByTestId("operator-home-first-review-path-strip")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_PILOT_FIRST_OPERATE_LATER_HEADING)).toBeInTheDocument();

    for (const step of PILOT_PATH_PREVIEW_STEPS) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("hides after the workspace has a committed review package", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    render(<OperatorHomeFirstReviewPathStrip />);

    expect(screen.queryByTestId("operator-home-first-review-path-strip")).toBeNull();
  });
});
