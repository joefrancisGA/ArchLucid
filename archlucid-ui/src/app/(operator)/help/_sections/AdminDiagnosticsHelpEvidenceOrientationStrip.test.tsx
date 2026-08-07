import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminDiagnosticsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AdminDiagnosticsHelpEvidenceOrientationStrip";
import {
  ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH,
  ADMIN_DIAGNOSTICS_HELP_SOURCES,
} from "@/lib/admin-diagnostics-help-evidence-copy";

describe("AdminDiagnosticsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking admin-diagnostics help", () => {
    render(<AdminDiagnosticsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("admin-diagnostics-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("admin-diagnostics-help-claim-discipline")).toBeInTheDocument();

    for (const link of ADMIN_DIAGNOSTICS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ADMIN_DIAGNOSTICS_HELP_SOURCES.some((link) => link.href === ADMIN_DIAGNOSTICS_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
