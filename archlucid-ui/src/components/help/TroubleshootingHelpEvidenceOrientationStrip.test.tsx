import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { TroubleshootingHelpEvidenceOrientationStrip } from "@/components/help/TroubleshootingHelpEvidenceOrientationStrip";
import {
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING,
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
} from "@/lib/troubleshooting-help-evidence-copy";

describe("TroubleshootingHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline, follow-ups heading, and related links", () => {
    render(<TroubleshootingHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("troubleshooting-help-claim-discipline")).toHaveTextContent(
      TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("heading", { name: TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );

    for (const link of TROUBLESHOOTING_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});
