import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE,
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/compliance-journey-evidence-copy";

import { ComplianceJourneyClaimOrientationStrip } from "./ComplianceJourneyClaimOrientationStrip";

describe("ComplianceJourneyClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<ComplianceJourneyClaimOrientationStrip />);

    expect(
      screen.getByRole("heading", { level: 2, name: COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-claim-discipline").textContent).toContain(
      COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("compliance-journey-sources")).toBeInTheDocument();
  });
});
