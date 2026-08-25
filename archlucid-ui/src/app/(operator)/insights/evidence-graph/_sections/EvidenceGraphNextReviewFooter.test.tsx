import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceGraphNextReviewFooter } from "./EvidenceGraphNextReviewFooter";

describe("EvidenceGraphNextReviewFooter", () => {
  it("renders next review graph link", () => {
    render(
      <EvidenceGraphNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/insights/evidence-graph?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("evidence-graph-next-review-footer")).toBeInTheDocument();
    expect(screen.getByText("Next review graph")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-next-review-action")).toHaveAttribute(
      "href",
      "/insights/evidence-graph?runId=run-2",
    );
  });
});
