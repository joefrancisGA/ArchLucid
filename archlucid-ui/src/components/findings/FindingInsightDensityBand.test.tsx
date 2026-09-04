import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingInsightDensityBand } from "./FindingInsightDensityBand";

describe("FindingInsightDensityBand", () => {
  it("renders a decision-grade band for high scores in Working mode rows", () => {
    render(<FindingInsightDensityBand findingId="f-1" insightDensityScore={88} />);

    expect(screen.getByTestId("finding-insight-density-band-tag-f-1")).toHaveTextContent("Decision-grade (88)");
  });

  it("renders nothing when score is absent", () => {
    const { container } = render(<FindingInsightDensityBand findingId="f-1" insightDensityScore={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
