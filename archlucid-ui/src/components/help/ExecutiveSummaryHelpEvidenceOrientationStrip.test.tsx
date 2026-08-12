import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveSummaryHelpEvidenceOrientationStrip } from "@/components/help/ExecutiveSummaryHelpEvidenceOrientationStrip";
import { EXECUTIVE_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/executive-summary-help-evidence-copy";

describe("ExecutiveSummaryHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline callout", () => {
    render(<ExecutiveSummaryHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-executive-summary-claim-discipline")).toHaveTextContent(
      EXECUTIVE_SUMMARY_HELP_CLAIM_DISCIPLINE,
    );
  });
});
