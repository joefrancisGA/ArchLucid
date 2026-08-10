import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditTrailHelpEvidenceOrientationStrip } from "@/components/help/AuditTrailHelpEvidenceOrientationStrip";
import {
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";

describe("AuditTrailHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-up links", () => {
    render(<AuditTrailHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("audit-trail-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-audit-trail-claim-discipline")).toHaveTextContent(
      AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
    );

    for (const source of AUDIT_TRAIL_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
