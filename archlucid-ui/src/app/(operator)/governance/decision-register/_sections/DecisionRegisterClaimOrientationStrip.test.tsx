import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterClaimOrientationStrip } from "./DecisionRegisterClaimOrientationStrip";

describe("DecisionRegisterClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<DecisionRegisterClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("decision-register-sources")).toBeInTheDocument();
  });
});
