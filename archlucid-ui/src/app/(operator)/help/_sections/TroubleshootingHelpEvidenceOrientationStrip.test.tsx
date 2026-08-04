import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TroubleshootingHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/TroubleshootingHelpEvidenceOrientationStrip";
import {
  TROUBLESHOOTING_HELP_CANONICAL_PATH,
  TROUBLESHOOTING_HELP_SOURCES,
} from "@/lib/troubleshooting-help-evidence-copy";

describe("TroubleshootingHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking troubleshooting help", () => {
    render(<TroubleshootingHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("troubleshooting-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("troubleshooting-help-claim-discipline")).toBeInTheDocument();

    for (const link of TROUBLESHOOTING_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      TROUBLESHOOTING_HELP_SOURCES.some((link) => link.href === TROUBLESHOOTING_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
