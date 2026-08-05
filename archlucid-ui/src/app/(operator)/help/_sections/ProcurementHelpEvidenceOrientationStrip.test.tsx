import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProcurementHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ProcurementHelpEvidenceOrientationStrip";
import {
  PROCUREMENT_HELP_CANONICAL_PATH,
  PROCUREMENT_HELP_SOURCES,
} from "@/lib/procurement-help-evidence-copy";

describe("ProcurementHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking procurement help", () => {
    render(<ProcurementHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("procurement-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("procurement-help-claim-discipline")).toBeInTheDocument();

    for (const link of PROCUREMENT_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PROCUREMENT_HELP_SOURCES.some((link) => link.href === PROCUREMENT_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
