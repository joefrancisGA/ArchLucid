import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeSampleReviewPreview } from "@/components/operator-home/OperatorHomeSampleReviewPreview";
import { OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const committedReviewMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

describe("OperatorHomeSampleReviewPreview (TB-353)", () => {
  it("renders sample findings with open-full CTA for first-run tenants", () => {
    committedReviewMock.value = false;

    render(<OperatorHomeSampleReviewPreview />);

    expect(screen.getByTestId("operator-home-sample-review-preview")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-sample-review-finding-list")).toBeInTheDocument();

    for (const finding of SHOWCASE_HOME_SAMPLE_FINDINGS) {
      expect(screen.getByTestId(`operator-home-sample-review-finding-${finding.id}`)).toBeInTheDocument();
      expect(screen.getByText(finding.title)).toBeInTheDocument();
    }

    expect(screen.getByTestId("operator-home-sample-review-open-full")).toHaveAttribute(
      "href",
      `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`,
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review sample findings" })).toBeInTheDocument();
  });

  it("hides once the tenant has a committed architecture review", () => {
    committedReviewMock.value = true;

    render(<OperatorHomeSampleReviewPreview />);

    expect(screen.queryByTestId("operator-home-sample-review-preview")).toBeNull();
  });
});
