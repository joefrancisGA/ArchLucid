import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE } from "@/lib/compliance-journey-evidence-copy";
import { ComplianceJourneyClaimOrientationStrip } from "./ComplianceJourneyClaimOrientationStrip";

describe("ComplianceJourneyClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<ComplianceJourneyClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
