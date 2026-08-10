import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareComparisonDimensionsPreview } from "./CompareComparisonDimensionsPreview";

describe("Compare workspace orientation", () => {
  it("renders comparison dimension preview for buyers", () => {
    render(<CompareComparisonDimensionsPreview />);

    expect(screen.getByTestId("compare-dimensions-preview")).toBeInTheDocument();
    expect(screen.getByText("Scope changes")).toBeInTheDocument();
    expect(screen.getByText("Governance status changes")).toBeInTheDocument();
  });
});
