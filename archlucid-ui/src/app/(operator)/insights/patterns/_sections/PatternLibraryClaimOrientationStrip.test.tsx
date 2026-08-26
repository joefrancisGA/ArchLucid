import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryClaimOrientationStrip } from "./PatternLibraryClaimOrientationStrip";

describe("PatternLibraryClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PatternLibraryClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-sources")).toBeInTheDocument();
  });
});
