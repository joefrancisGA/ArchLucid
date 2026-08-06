import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceTrailHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/EvidenceTrailHelpEvidenceOrientationStrip";
import {
  EVIDENCE_TRAIL_HELP_CANONICAL_PATH,
  EVIDENCE_TRAIL_HELP_SOURCES,
} from "@/lib/evidence-trail-help-evidence-copy";

describe("EvidenceTrailHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking evidence-trail help", () => {
    render(<EvidenceTrailHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("evidence-trail-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("evidence-trail-help-claim-discipline")).toBeInTheDocument();

    for (const link of EVIDENCE_TRAIL_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      EVIDENCE_TRAIL_HELP_SOURCES.some((link) => link.href === EVIDENCE_TRAIL_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
