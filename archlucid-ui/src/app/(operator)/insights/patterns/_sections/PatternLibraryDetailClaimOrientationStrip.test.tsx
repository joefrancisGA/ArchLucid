import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryDetailClaimOrientationStrip } from "./PatternLibraryDetailClaimOrientationStrip";
import {
  PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE,
  PATTERN_LIBRARY_DETAIL_CLAIM_HEADING,
  PATTERN_LIBRARY_DETAIL_SOURCES_INTRO,
} from "@/lib/pattern-library-detail-evidence-copy";

describe("PatternLibraryDetailClaimOrientationStrip", () => {
  it("mounts claim discipline and sources for pattern library detail", () => {
    render(<PatternLibraryDetailClaimOrientationStrip />);

    expect(screen.getByTestId("pattern-library-detail-orientation")).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_DETAIL_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByText(PATTERN_LIBRARY_DETAIL_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-sources")).toBeInTheDocument();
  });
});
