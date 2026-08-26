import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryDetailClaimOrientationStrip } from "./PatternLibraryDetailClaimOrientationStrip";

describe("PatternLibraryDetailClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PatternLibraryDetailClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-detail-sources")).toBeInTheDocument();
  });
});
