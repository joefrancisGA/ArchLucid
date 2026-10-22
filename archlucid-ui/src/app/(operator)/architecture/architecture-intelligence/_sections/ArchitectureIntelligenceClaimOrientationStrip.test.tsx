import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureIntelligenceClaimOrientationStrip } from "./ArchitectureIntelligenceClaimOrientationStrip";

describe("ArchitectureIntelligenceClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<ArchitectureIntelligenceClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-sources")).toBeInTheDocument();
  });
});
