import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryEvidenceOrientationStrip } from "@/app/(operator)/insights/patterns/_sections/PatternLibraryEvidenceOrientationStrip";
import {
  PATTERN_LIBRARY_CANONICAL_PATH,
  PATTERN_LIBRARY_SOURCES,
} from "@/lib/pattern-library-evidence-copy";

describe("PatternLibraryEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the patterns hub", () => {
    render(<PatternLibraryEvidenceOrientationStrip />);

    expect(screen.getByTestId("pattern-library-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-claim-discipline")).toHaveTextContent(
      /Anonymized|diligence Sources|CPA SOC 2/i,
    );

    const sources = screen.getByTestId("pattern-library-sources");

    for (const link of PATTERN_LIBRARY_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PATTERN_LIBRARY_SOURCES.some((link) => link.href === PATTERN_LIBRARY_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
