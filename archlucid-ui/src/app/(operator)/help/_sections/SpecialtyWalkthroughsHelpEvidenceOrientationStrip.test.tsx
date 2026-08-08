import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SpecialtyWalkthroughsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/SpecialtyWalkthroughsHelpEvidenceOrientationStrip";
import {
  SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH,
  SPECIALTY_WALKTHROUGHS_HELP_SOURCES,
} from "@/lib/specialty-walkthroughs-help-evidence-copy";

describe("SpecialtyWalkthroughsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking specialty-walkthroughs help", () => {
    render(<SpecialtyWalkthroughsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("specialty-walkthroughs-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("specialty-walkthroughs-help-claim-discipline")).toBeInTheDocument();

    for (const link of SPECIALTY_WALKTHROUGHS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      SPECIALTY_WALKTHROUGHS_HELP_SOURCES.some(
        (link) => link.href === SPECIALTY_WALKTHROUGHS_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
