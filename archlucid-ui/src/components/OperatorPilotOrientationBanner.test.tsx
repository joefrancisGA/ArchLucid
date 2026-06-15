import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPilotOrientationBanner } from "@/components/OperatorPilotOrientationBanner";

describe("OperatorPilotOrientationBanner", () => {
  it("shows one primary action and three secondary links", () => {
    render(<OperatorPilotOrientationBanner />);

    expect(screen.getByTestId("operator-pilot-primary-action")).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByTestId("operator-pilot-secondary-first-run")).toBeInTheDocument();
    expect(screen.getByTestId("operator-pilot-secondary-help")).toHaveAttribute("href", "/help/first-pilot-path");
    expect(screen.getByTestId("operator-pilot-secondary-reviews")).toHaveAttribute("href", "/reviews");
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});
