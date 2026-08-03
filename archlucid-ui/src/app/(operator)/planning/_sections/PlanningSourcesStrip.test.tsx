import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningSourcesStrip } from "@/app/(operator)/planning/_sections/PlanningSourcesStrip";
import { PLANNING_CANONICAL_PATH, PLANNING_SOURCES } from "@/lib/planning-evidence-copy";

describe("PlanningSourcesStrip", () => {
  it("lists follow-up Sources without self-linking planning", () => {
    render(<PlanningSourcesStrip />);

    expect(screen.getByTestId("planning-sources")).toBeInTheDocument();
    expect(screen.getByTestId("planning-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(/derived from captured review feedback/i)).toBeInTheDocument();

    const sources = screen.getByTestId("planning-sources");

    for (const link of PLANNING_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PLANNING_SOURCES.some((link) => link.href === PLANNING_CANONICAL_PATH)).toBe(false);
  });
});
