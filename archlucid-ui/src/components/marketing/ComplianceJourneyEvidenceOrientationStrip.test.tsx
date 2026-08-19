import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceJourneyEvidenceOrientationStrip } from "@/components/marketing/ComplianceJourneyEvidenceOrientationStrip";
import {
  COMPLIANCE_JOURNEY_CANONICAL_PATH,
  COMPLIANCE_JOURNEY_SOURCES,
  COMPLIANCE_JOURNEY_SOURCES_INTRO,
} from "@/lib/compliance-journey-evidence-copy";

describe("ComplianceJourneyEvidenceOrientationStrip", () => {
  it("renders Sources footer without the posture-summary claim callout", () => {
    render(<ComplianceJourneyEvidenceOrientationStrip />);

    expect(screen.getByTestId("compliance-journey-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("compliance-journey-claim-discipline")).toBeNull();
    expect(screen.getByText(COMPLIANCE_JOURNEY_SOURCES_INTRO)).toBeInTheDocument();

    for (const link of COMPLIANCE_JOURNEY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      COMPLIANCE_JOURNEY_SOURCES.some((link) => link.href === COMPLIANCE_JOURNEY_CANONICAL_PATH),
    ).toBe(false);
  });
});
