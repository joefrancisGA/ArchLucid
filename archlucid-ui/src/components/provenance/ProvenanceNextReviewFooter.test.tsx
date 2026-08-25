import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProvenanceNextReviewFooter } from "./ProvenanceNextReviewFooter";

describe("ProvenanceNextReviewFooter", () => {
  it("renders next review provenance link", () => {
    render(
      <ProvenanceNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/architecture/reviews/run-2/provenance",
        }}
      />,
    );

    expect(screen.getByTestId("provenance-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review provenance")).toBeInTheDocument();
    expect(screen.getByTestId("provenance-next-review-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-2/provenance",
    );
  });
});
