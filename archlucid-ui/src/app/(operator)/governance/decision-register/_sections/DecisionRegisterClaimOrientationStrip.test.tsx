import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterClaimOrientationStrip } from "./DecisionRegisterClaimOrientationStrip";
import { DECISION_REGISTER_CLAIM_HEADING } from "../decision-register-copy";
import { DECISION_REGISTER_CLAIM_DISCIPLINE } from "@/lib/decision-register-evidence-copy";

describe("DecisionRegisterClaimOrientationStrip", () => {
  it("renders claim heading and discipline copy", () => {
    render(<DecisionRegisterClaimOrientationStrip />);

    expect(screen.getByText(DECISION_REGISTER_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DECISION_REGISTER_CLAIM_DISCIPLINE)).toBeInTheDocument();
  });
});
