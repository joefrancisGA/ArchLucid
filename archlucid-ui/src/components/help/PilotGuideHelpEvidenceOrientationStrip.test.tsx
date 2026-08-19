import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotGuideHelpEvidenceOrientationStrip } from "@/components/help/PilotGuideHelpEvidenceOrientationStrip";
import { PILOT_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-guide-help-evidence-copy";

describe("PilotGuideHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline callout", () => {
    render(<PilotGuideHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("pilot-guide-help-claim-discipline")).toHaveTextContent(
      PILOT_GUIDE_HELP_CLAIM_DISCIPLINE,
    );
  });
});
