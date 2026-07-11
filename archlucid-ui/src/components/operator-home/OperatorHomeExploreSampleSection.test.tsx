import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeExploreSampleSection } from "@/components/operator-home/OperatorHomeExploreSampleSection";
import {
  OPERATOR_HOME_EXPLORE_SAMPLE_HEADING,
  OPERATOR_HOME_EXPLORE_SAMPLE_LEAD,
  OPERATOR_HOME_OPEN_COMPLETED_SAMPLE_HINT,
  OPERATOR_HOME_OPEN_CREATED_SAMPLE_CTA,
  OPERATOR_HOME_OPEN_CREATED_SAMPLE_HINT,
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  OPERATOR_HOME_RUN_SAMPLE_REVIEW_HINT,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";
import {
  OPERATOR_HOME_EXAMPLE_TEMPLATE_ID,
  reviewIntakeExampleTemplateHref,
} from "@/lib/operator-home-example-request";
import {
  SHOWCASE_SAMPLE_CREATED_REGISTRY,
  showcaseSampleCreatedPackageHref,
} from "@/lib/showcase-sample-created-registry";
import {
  SHOWCASE_SAMPLE_REVIEW_REGISTRY,
  showcaseSampleReviewPackageHref,
} from "@/lib/showcase-sample-review-registry";

const committedReviewMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: () => committedReviewMock.value,
}));

describe("OperatorHomeExploreSampleSection", () => {
  it("renders consolidated sample workspace actions for first-run tenants", () => {
    committedReviewMock.value = false;

    render(<OperatorHomeExploreSampleSection />);

    expect(screen.getByTestId("operator-home-explore-sample-section")).toBeInTheDocument();

    const title = screen.getByRole("heading", { level: 2, name: OPERATOR_HOME_EXPLORE_SAMPLE_HEADING });
    expect(title).toHaveAttribute("id", "operator-home-explore-sample-heading");
    expect(title.className).toContain("text-[15px]");
    expect(title.className).not.toContain("text-lg");

    for (const token of OPERATOR_HOME_CARD_SECTION_HEADING.split(/\s+/)) {
      if (token.length > 0) {
        expect(title.className).toContain(token);
      }
    }

    expect(screen.getByText(OPERATOR_HOME_EXPLORE_SAMPLE_LEAD)).toBeInTheDocument();

    expect(screen.getByTestId("operator-home-explore-open-completed-sample")).toHaveAttribute(
      "href",
      showcaseSampleReviewPackageHref(SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId),
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA })).toBeInTheDocument();

    expect(screen.getByTestId("operator-home-explore-open-created-sample")).toHaveAttribute(
      "href",
      showcaseSampleCreatedPackageHref(SHOWCASE_SAMPLE_CREATED_REGISTRY.runId),
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_OPEN_CREATED_SAMPLE_CTA })).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_OPEN_CREATED_SAMPLE_HINT)).toBeInTheDocument();

    expect(screen.getByTestId("operator-home-explore-run-sample-review")).toHaveAttribute(
      "href",
      reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID),
    );
    expect(screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA })).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_OPEN_COMPLETED_SAMPLE_HINT)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_RUN_SAMPLE_REVIEW_HINT)).toBeInTheDocument();
  });

  it("hides once the tenant has a committed architecture review", () => {
    committedReviewMock.value = true;

    render(<OperatorHomeExploreSampleSection />);

    expect(screen.queryByTestId("operator-home-explore-sample-section")).toBeNull();
  });
});
