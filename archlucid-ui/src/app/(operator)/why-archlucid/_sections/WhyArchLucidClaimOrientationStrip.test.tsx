import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyArchLucidClaimOrientationStrip } from "./WhyArchLucidClaimOrientationStrip";

describe("WhyArchLucidClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<WhyArchLucidClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("why-archlucid-sources")).toBeInTheDocument();
  });
});
