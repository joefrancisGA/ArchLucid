import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeSampleReviewPreview } from "@/components/operator-home/OperatorHomeSampleReviewPreview";
import {
  OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_INCLUDES_LABEL,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
} from "@/lib/buyer-polish-copy";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
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
    expect(screen.getByTestId("operator-home-sample-review-includes-label")).toHaveTextContent(
      OPERATOR_HOME_SAMPLE_FINDINGS_INCLUDES_LABEL,
    );
    expect(screen.queryByText(/architecture request/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("operator-home-sample-review-finding-list")).toBeInTheDocument();

    for (const finding of SHOWCASE_HOME_SAMPLE_FINDINGS) {
      const row = screen.getByTestId(`operator-home-sample-review-finding-${finding.id}`);
      expect(row).toBeInTheDocument();
      expect(screen.getByText(finding.title)).toBeInTheDocument();
      expect(screen.getByText(finding.summary)).toBeInTheDocument();

      // Preview rows are sample content, not actions: no button/link semantics or keyboard focus.
      expect(row.tagName).toBe("LI");
      expect(row.querySelector("button, a")).toBeNull();
      expect(row).not.toHaveAttribute("role", "button");
      expect(row).not.toHaveAttribute("role", "link");
      expect(row).not.toHaveAttribute("tabindex");
      expect(row.className).not.toMatch(/rounded-md|shadow|hover:|cursor-pointer/);
    }

    const findingList = screen.getByTestId("operator-home-sample-review-finding-list");
    expect(findingList).toHaveAttribute("aria-label", "Sample findings included in the review");

    expect(screen.getByTestId("operator-home-sample-review-run")).toHaveAttribute(
      "href",
      reviewIntakeExampleTemplateHref(OPERATOR_HOME_EXAMPLE_TEMPLATE_ID),
    );

    const runCta = screen.getByRole("link", { name: OPERATOR_HOME_REVIEW_SAMPLE_FINDINGS_CTA });
    expect(runCta).toBeInTheDocument();
    expect(screen.queryByTestId("operator-home-sample-review-open")).toBeNull();

    // Hero owns "Open completed sample"; the card only offers the guided sample run.
    expect(runCta.className).not.toContain("al-primary-action-bg");
    expect(runCta.className).toContain("border-neutral-300");
  });

  it("hides once the tenant has a committed architecture review", () => {
    committedReviewMock.value = true;

    render(<OperatorHomeSampleReviewPreview />);

    expect(screen.queryByTestId("operator-home-sample-review-preview")).toBeNull();
  });
});
