import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceApprovalHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/GovernanceApprovalHelpEvidenceOrientationStrip";
import {
  GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH,
  GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE,
  GOVERNANCE_APPROVAL_HELP_SOURCES,
  GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO,
} from "@/lib/governance-approval-help-evidence-copy";

describe("GovernanceApprovalHelpEvidenceOrientationStrip", () => {
  it("renders Sources and claim-discipline chrome", () => {
    render(<GovernanceApprovalHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("governance-approval-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("governance-approval-help-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_APPROVAL_HELP_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE)).toBeInTheDocument();

    for (const link of GOVERNANCE_APPROVAL_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(GOVERNANCE_APPROVAL_HELP_SOURCES.some((link) => link.href === GOVERNANCE_APPROVAL_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
