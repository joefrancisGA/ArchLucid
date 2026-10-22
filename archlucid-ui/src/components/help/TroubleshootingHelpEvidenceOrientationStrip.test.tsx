import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { TroubleshootingHelpEvidenceOrientationStrip } from "@/components/help/TroubleshootingHelpEvidenceOrientationStrip";
import {
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING,
  TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
} from "@/lib/troubleshooting-help-evidence-copy";

describe("TroubleshootingHelpEvidenceOrientationStrip", () => {
  it("renders follow-ups heading and filtered related links without duplicate claim discipline", () => {
    render(<TroubleshootingHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBandContent(
      screen,
      "troubleshooting-help",
      "troubleshooting-help-claim-discipline",
      TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineHeading(
      screen,
      "troubleshooting-help",
      TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING,
      "help-troubleshooting-claim-discipline-heading",
    );
    expect(screen.getByRole("heading", { name: TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE })).toHaveAttribute(
      "id",
      "where-to-go-next",
    );

    expectWhereToGoNextFollowUpLinks(screen, TROUBLESHOOTING_HELP_SOURCES);
  });
});
