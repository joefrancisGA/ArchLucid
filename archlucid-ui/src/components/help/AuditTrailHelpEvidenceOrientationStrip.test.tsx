import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { AuditTrailHelpEvidenceOrientationStrip } from "@/components/help/AuditTrailHelpEvidenceOrientationStrip";
import {
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";

describe("AuditTrailHelpEvidenceOrientationStrip", () => {
  it("renders sources-only follow-ups because claim discipline is folded into the page header", () => {
    render(<AuditTrailHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("audit-trail-help-orientation")).toBeInTheDocument();
    expect(screen.queryByTestId("help-audit-trail-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );

    for (const source of AUDIT_TRAIL_HELP_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});
