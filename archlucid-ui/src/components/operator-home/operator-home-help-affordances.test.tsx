import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";

describe("OperatorHomeGuidanceLink", () => {
  it("renders visible text guidance instead of an icon-only control", () => {
    render(<OperatorHomeGuidanceLink helpSlug="core-pilot" label="Open Core Pilot guide" />);

    const link = screen.getByRole("link", { name: "Open Core Pilot guide" });

    expect(link).toHaveTextContent("Open Core Pilot guide");
    expect(link).toHaveAttribute("href", "/help/first-architecture-review");
  });
});
