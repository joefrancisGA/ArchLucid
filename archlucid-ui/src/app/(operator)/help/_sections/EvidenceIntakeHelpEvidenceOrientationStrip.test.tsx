import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceIntakeHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/EvidenceIntakeHelpEvidenceOrientationStrip";
import {
  EVIDENCE_INTAKE_HELP_CANONICAL_PATH,
  EVIDENCE_INTAKE_HELP_SOURCES,
} from "@/lib/evidence-intake-help-evidence-copy";

describe("EvidenceIntakeHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking evidence-intake help", () => {
    render(<EvidenceIntakeHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("evidence-intake-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-intake-help-claim-discipline")).toBeInTheDocument();

    for (const link of EVIDENCE_INTAKE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      EVIDENCE_INTAKE_HELP_SOURCES.some((link) => link.href === EVIDENCE_INTAKE_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
