import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ValueReportIncludesSection } from "./ValueReportIncludesSection";

describe("ValueReportIncludesSection", () => {
  it("lists sponsor report sections", () => {
    render(<ValueReportIncludesSection />);

    expect(screen.getByTestId("value-report-includes")).toBeInTheDocument();
    expect(screen.getByText("Sponsor report includes")).toBeInTheDocument();
    expect(screen.getByText("Finalized reviews")).toBeInTheDocument();
    expect(screen.getByText("Recommended next actions")).toBeInTheDocument();
  });
});
