import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditTrailHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AuditTrailHelpEvidenceOrientationStrip";
import {
  AUDIT_TRAIL_HELP_CANONICAL_PATH,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";

describe("AuditTrailHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking audit-trail help", () => {
    render(<AuditTrailHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("audit-trail-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("audit-trail-help-claim-discipline")).toBeInTheDocument();

    for (const link of AUDIT_TRAIL_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AUDIT_TRAIL_HELP_SOURCES.some((link) => link.href === AUDIT_TRAIL_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
