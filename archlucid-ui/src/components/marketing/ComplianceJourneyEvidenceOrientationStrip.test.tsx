import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComplianceJourneyEvidenceOrientationStrip } from "@/components/marketing/ComplianceJourneyEvidenceOrientationStrip";
import {
  COMPLIANCE_JOURNEY_CANONICAL_PATH,
  COMPLIANCE_JOURNEY_SOURCES,
} from "@/lib/compliance-journey-evidence-copy";

describe("ComplianceJourneyEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking compliance journey", () => {
    render(<ComplianceJourneyEvidenceOrientationStrip />);

    expect(screen.getByTestId("compliance-journey-sources")).toBeInTheDocument();
    expect(screen.getByTestId("compliance-journey-claim-discipline")).toBeInTheDocument();

    for (const link of COMPLIANCE_JOURNEY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      COMPLIANCE_JOURNEY_SOURCES.some((link) => link.href === COMPLIANCE_JOURNEY_CANONICAL_PATH),
    ).toBe(false);
  });
});
