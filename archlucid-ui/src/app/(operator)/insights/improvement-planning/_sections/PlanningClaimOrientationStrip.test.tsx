import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningClaimOrientationStrip } from "@/app/(operator)/insights/improvement-planning/_sections/PlanningClaimOrientationStrip";
import {
  PLANNING_CLAIM_DISCIPLINE,
  PLANNING_CLAIM_DISCIPLINE_HEADING,
  PLANNING_SOURCES_INTRO,
} from "@/lib/planning-evidence-copy";

describe("PlanningClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for improvement planning", () => {
    render(<PlanningClaimOrientationStrip />);

    expect(screen.getByTestId("improvement-planning-orientation")).toBeInTheDocument();
    expect(screen.getByText(PLANNING_CLAIM_DISCIPLINE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PLANNING_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(PLANNING_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("improvement-planning-sources")).toBeInTheDocument();
  });
});
