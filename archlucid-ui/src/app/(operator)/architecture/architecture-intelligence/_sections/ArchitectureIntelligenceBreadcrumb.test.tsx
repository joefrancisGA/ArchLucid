import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceBreadcrumb } from "./ArchitectureIntelligenceBreadcrumb";

describe("ArchitectureIntelligenceBreadcrumb", () => {
  it("renders reviews trail to architecture intelligence", () => {
    render(<ArchitectureIntelligenceBreadcrumb />);

    expect(screen.getByTestId("architecture-intelligence-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reviews" })).toHaveAttribute("href", "/architecture/reviews");
    expect(screen.getByText("Architecture intelligence")).toBeInTheDocument();
  });
});
