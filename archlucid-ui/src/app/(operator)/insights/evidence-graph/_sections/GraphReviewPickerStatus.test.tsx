import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphReviewPickerStatus } from "@/app/(operator)/insights/evidence-graph/_sections/GraphReviewPickerStatus";
import { BUYER_EVIDENCE_GRAPH_PICKER_SAMPLE_REVIEW } from "@/lib/buyer/buyer-polish-copy";

describe("GraphReviewPickerStatus (TB-1363)", () => {
  it("labels sample-review picker state as Claims Intake sample", () => {
    render(<GraphReviewPickerStatus state="sample-review" />);

    const status = screen.getByTestId("graph-review-picker-status");

    expect(status).toHaveAttribute("data-picker-state", "sample-review");
    expect(status).toHaveTextContent(BUYER_EVIDENCE_GRAPH_PICKER_SAMPLE_REVIEW);
    expect(status).toHaveTextContent("Claims Intake");
  });
});
