import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { AuditTrailHelpEvidenceOrientationStrip } from "@/components/help/AuditTrailHelpEvidenceOrientationStrip";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING,
  AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";

describe("AuditTrailHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-up links", () => {
    render(<AuditTrailHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("audit-trail-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-claim-discipline")).toHaveTextContent(
      AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("heading", { name: AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: AUDIT_TRAIL_HELP_FOLLOW_UPS_TITLE })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );

    for (const source of AUDIT_TRAIL_HELP_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});
