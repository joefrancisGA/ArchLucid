import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesNewClaimOrientationStrip } from "./ArchitecturesNewClaimOrientationStrip";

describe("ArchitecturesNewClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<ArchitecturesNewClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("architectures-new-sources")).toBeInTheDocument();
  });
});
