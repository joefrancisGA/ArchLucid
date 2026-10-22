import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterClaimOrientationStrip } from "./DecisionRegisterClaimOrientationStrip";
import {
  DECISION_REGISTER_CANONICAL_PATH,
  DECISION_REGISTER_FOLLOW_UPS_TITLE,
} from "@/lib/decision-register-evidence-copy";

describe("DecisionRegisterClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<DecisionRegisterClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DECISION_REGISTER_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-sources")).toBeInTheDocument();
  });

  it("does not link back to the decision register route", () => {
    render(<DecisionRegisterClaimOrientationStrip />);

    expect(screen.queryByRole("link", { name: /decision register/i })).not.toBeInTheDocument();

    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toBe(DECISION_REGISTER_CANONICAL_PATH);
    }
  });
});
