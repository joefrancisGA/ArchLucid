import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AlertsHelpEvidenceOrientationStrip";
import { ALERTS_HELP_CANONICAL_PATH, ALERTS_HELP_SOURCES } from "@/lib/alerts-help-evidence-copy";

describe("AlertsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking alerts help", () => {
    render(<AlertsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("alerts-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-help-claim-discipline")).toBeInTheDocument();

    for (const link of ALERTS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(ALERTS_HELP_SOURCES.some((link) => link.href === ALERTS_HELP_CANONICAL_PATH)).toBe(false);
  });
});
