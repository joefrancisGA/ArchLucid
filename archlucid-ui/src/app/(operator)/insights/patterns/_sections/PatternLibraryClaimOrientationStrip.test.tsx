import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryClaimOrientationStrip } from "@/app/(operator)/insights/patterns/_sections/PatternLibraryClaimOrientationStrip";
import {
  PATTERN_LIBRARY_CLAIM_DISCIPLINE,
  PATTERN_LIBRARY_CLAIM_HEADING,
  PATTERN_LIBRARY_SOURCES_INTRO,
} from "@/lib/pattern-library-evidence-copy";

describe("PatternLibraryClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for the pattern library hub", () => {
    render(<PatternLibraryClaimOrientationStrip />);

    expect(screen.getByTestId("pattern-library-orientation")).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-sources")).toBeInTheDocument();
  });
});
