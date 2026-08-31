import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewOutcomeTaxonomyLegend } from "@/components/ReviewOutcomeTaxonomyLegend";

describe("ReviewOutcomeTaxonomyLegend", () => {
  it("renders stacked definitions in conceptual order", () => {
    render(<ReviewOutcomeTaxonomyLegend />);

    const legend = screen.getByTestId("review-outcome-taxonomy-legend");
    const terms = Array.from(legend.querySelectorAll("dt")).map((node) => node.textContent);

    expect(terms).toEqual([
      "Decision",
      "Finding",
      "Risk",
      "Monitored risk",
      "Control",
      "Approval status",
      "Deliverable",
      "Audit event",
    ]);
    expect(screen.getByText(/approved architecture choice recorded/i)).toBeInTheDocument();
  });
});
