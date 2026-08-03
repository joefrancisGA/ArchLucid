import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureScorecardSourcesStrip } from "@/app/(operator)/insights/architecture-scorecard/_sections/ArchitectureScorecardSourcesStrip";
import {
  ARCHITECTURE_SCORECARD_CANONICAL_PATH,
  ARCHITECTURE_SCORECARD_SOURCES,
} from "@/lib/architecture-scorecard-page-copy";

describe("ArchitectureScorecardSourcesStrip", () => {
  it("lists follow-up Sources without self-linking the scorecard", () => {
    render(<ArchitectureScorecardSourcesStrip />);

    expect(screen.getByTestId("architecture-scorecard-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-scorecard-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(/directional for pilot value/i)).toBeInTheDocument();
    expect(screen.getByText(/not financial reporting/i)).toBeInTheDocument();

    const sources = screen.getByTestId("architecture-scorecard-sources");

    for (const link of ARCHITECTURE_SCORECARD_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ARCHITECTURE_SCORECARD_SOURCES.some((link) => link.href === ARCHITECTURE_SCORECARD_CANONICAL_PATH),
    ).toBe(false);
  });
});
