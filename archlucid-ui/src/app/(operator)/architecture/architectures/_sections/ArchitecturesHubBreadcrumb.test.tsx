import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesHubBreadcrumb } from "./ArchitecturesHubBreadcrumb";

describe("ArchitecturesHubBreadcrumb", () => {
  it("renders architecture trail to drafts list", () => {
    render(<ArchitecturesHubBreadcrumb />);

    expect(screen.getByTestId("architectures-hub-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Architecture" })).toHaveAttribute("href", "/architecture/reviews");
    expect(screen.getByText("Architecture drafts")).toBeInTheDocument();
  });
});
