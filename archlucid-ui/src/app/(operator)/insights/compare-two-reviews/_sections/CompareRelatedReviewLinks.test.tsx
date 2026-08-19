import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA, BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";

import { CompareRelatedReviewLinks } from "./CompareRelatedReviewLinks";

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("CompareRelatedReviewLinks", () => {
  it("renders nothing when no run ids are selected and static demo fallback is off", () => {
    const { container } = render(<CompareRelatedReviewLinks />);

    expect(container).toBeEmptyDOMElement();
  });

  it("resolves CTAs to the selected updated review id", () => {
    render(
      <CompareRelatedReviewLinks
        baselineRunId="baseline-run"
        updatedRunId="updated-run"
        preferredRunId="updated-run"
      />,
    );

    expect(screen.getByRole("link", { name: BUYER_COMPARE_OPEN_SIGNED_REVIEW_RECORD_CTA })).toHaveAttribute(
      "href",
      "/architecture/reviews/updated-run",
    );
    expect(screen.getByRole("link", { name: BUYER_COMPARE_OPEN_EVIDENCE_TRAIL_CTA })).toHaveAttribute(
      "href",
      "/insights/evidence-graph?runId=updated-run",
    );
  });
});
