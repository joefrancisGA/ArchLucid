import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/FindingsHelpEvidenceOrientationStrip";
import {
  FINDINGS_HELP_CANONICAL_PATH,
  FINDINGS_HELP_SOURCES,
} from "@/lib/findings-help-evidence-copy";

describe("FindingsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking findings help", () => {
    render(<FindingsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("findings-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("findings-help-claim-discipline")).toBeInTheDocument();

    for (const link of FINDINGS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(FINDINGS_HELP_SOURCES.some((link) => link.href === FINDINGS_HELP_CANONICAL_PATH)).toBe(false);
  });
});
