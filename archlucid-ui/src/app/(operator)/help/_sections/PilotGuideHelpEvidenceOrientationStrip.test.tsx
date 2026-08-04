import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotGuideHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/PilotGuideHelpEvidenceOrientationStrip";
import {
  PILOT_GUIDE_HELP_CANONICAL_PATH,
  PILOT_GUIDE_HELP_SOURCES,
} from "@/lib/pilot-guide-help-evidence-copy";

describe("PilotGuideHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking pilot guide help", () => {
    render(<PilotGuideHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("pilot-guide-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-guide-help-claim-discipline")).toBeInTheDocument();

    for (const link of PILOT_GUIDE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PILOT_GUIDE_HELP_SOURCES.some((link) => link.href === PILOT_GUIDE_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
