import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScopeHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ScopeHelpEvidenceOrientationStrip";
import { SCOPE_HELP_CANONICAL_PATH, SCOPE_HELP_SOURCES } from "@/lib/scope-help-evidence-copy";

describe("ScopeHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking scope help", () => {
    render(<ScopeHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("scope-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("scope-help-claim-discipline")).toBeInTheDocument();

    for (const link of SCOPE_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SCOPE_HELP_SOURCES.some((link) => link.href === SCOPE_HELP_CANONICAL_PATH)).toBe(false);
  });
});
