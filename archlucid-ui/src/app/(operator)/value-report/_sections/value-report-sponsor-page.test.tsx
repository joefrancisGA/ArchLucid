import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ValueReportEmptyState } from "./ValueReportEmptyState";
import { ValueReportIncludesSection } from "./ValueReportIncludesSection";

describe("ValueReportEmptyState", () => {
  it("uses report-contextual CTAs instead of create-architecture primary", () => {
    render(<ValueReportEmptyState />);

    expect(screen.getByText("No finalized reviews in this report period")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open reviews" })).toHaveAttribute("href", "/reviews?projectId=default");
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: "View sample value report" })).toHaveAttribute("href", "/value-report/pilot");
    expect(screen.queryByRole("link", { name: "Create architecture" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Load sample workspace/i)).not.toBeInTheDocument();
  });
});

describe("ValueReportIncludesSection", () => {
  it("lists sponsor report sections", () => {
    render(<ValueReportIncludesSection />);

    expect(screen.getByTestId("value-report-includes")).toBeInTheDocument();
    expect(screen.getByText("Sponsor report includes")).toBeInTheDocument();
    expect(screen.getByText("Finalized reviews")).toBeInTheDocument();
    expect(screen.getByText("Recommended next actions")).toBeInTheDocument();
  });
});
