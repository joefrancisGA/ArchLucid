import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorReportHelpEvidenceOrientationStrip } from "@/components/help/SponsorReportHelpEvidenceOrientationStrip";
import { SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/sponsor-report-help-evidence-copy";

describe("SponsorReportHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline callout", () => {
    render(<SponsorReportHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-sponsor-report-claim-discipline")).toHaveTextContent(
      SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE,
    );
  });
});
