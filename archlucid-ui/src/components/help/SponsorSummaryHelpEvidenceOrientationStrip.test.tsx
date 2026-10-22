import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorSummaryHelpEvidenceOrientationStrip } from "@/components/help/SponsorSummaryHelpEvidenceOrientationStrip";
import { SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/sponsor-report-help-evidence-copy";

describe("SponsorSummaryHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline callout", () => {
    render(<SponsorSummaryHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-sponsor-report-claim-discipline")).toHaveTextContent(
      SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE,
    );
  });
});
