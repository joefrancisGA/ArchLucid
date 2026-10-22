import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningClaimOrientationStrip } from "./PlanningClaimOrientationStrip";

describe("PlanningClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PlanningClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("improvement-planning-sources")).toBeInTheDocument();
  });
});
