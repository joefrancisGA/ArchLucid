import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPilotOrientationBanner } from "@/components/OperatorPilotOrientationBanner";

describe("OperatorPilotOrientationBanner", () => {
  it("links the walkthrough to Your first architecture review help once", () => {
    render(<OperatorPilotOrientationBanner />);

    expect(screen.getByRole("heading", { name: "Your first architecture review" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-pilot-secondary-first-run")).toHaveAttribute(
      "href",
      "/help/first-architecture-review",
    );
    expect(screen.queryByTestId("operator-pilot-secondary-help")).toBeNull();
    expect(screen.getByTestId("operator-pilot-secondary-reviews")).toHaveAttribute("href", "/architecture/reviews");
  });
});
