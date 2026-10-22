import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackDetailClaimOrientationStrip } from "./PolicyPackDetailClaimOrientationStrip";

describe("PolicyPackDetailClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<PolicyPackDetailClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-detail-sources")).toBeInTheDocument();
  });
});
