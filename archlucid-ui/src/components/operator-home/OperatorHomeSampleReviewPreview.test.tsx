import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeSampleReviewPreview } from "@/components/operator-home/OperatorHomeSampleReviewPreview";
import {
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
} from "@/lib/buyer-polish-copy";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";

const committedReviewMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

describe("OperatorHomeSampleReviewPreview (TB-353)", () => {
  it("renders sample findings with run and open-completed CTAs for first-run tenants", () => {
    committedReviewMock.value = false;

    render(<OperatorHomeSampleReviewPreview />);

    expect(screen.getByTestId("operator-home-sample-review-preview")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_SAMPLE_FINDINGS_LEAD)).toBeInTheDocument();
    expect(screen.queryByText(/architecture request/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-home-sample-review-finding-list")).toBeInTheDocument();

    for (const finding of SHOWCASE_HOME_SAMPLE_FINDINGS) {
      expect(screen.getByTestId(`operator-home-sample-review-finding-${finding.id}`)).toBeInTheDocument();
      expect(screen.getByText(finding.title)).toBeInTheDocument();
    }

    expect(screen.getByTestId("operator-home-sample-review-run")).toHaveAttribute(
      "href",
      reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID),
    );
    expect(screen.getByTestId("operator-home-sample-review-open")).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA })).toBeInTheDocument();
  });

  it("hides once the tenant has a committed architecture review", () => {
    committedReviewMock.value = true;

    render(<OperatorHomeSampleReviewPreview />);

    expect(screen.queryByTestId("operator-home-sample-review-preview")).toBeNull();
  });
});
