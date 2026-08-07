import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveSummaryHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ExecutiveSummaryHelpEvidenceOrientationStrip";
import {
  EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH,
  EXECUTIVE_SUMMARY_HELP_SOURCES,
} from "@/lib/executive-summary-help-evidence-copy";

describe("ExecutiveSummaryHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking executive-summary help", () => {
    render(<ExecutiveSummaryHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("executive-summary-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("executive-summary-help-claim-discipline")).toBeInTheDocument();

    for (const link of EXECUTIVE_SUMMARY_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      EXECUTIVE_SUMMARY_HELP_SOURCES.some(
        (link) => link.href === EXECUTIVE_SUMMARY_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
