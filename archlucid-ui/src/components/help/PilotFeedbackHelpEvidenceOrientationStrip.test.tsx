import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { PilotFeedbackHelpEvidenceOrientationStrip } from "@/components/help/PilotFeedbackHelpEvidenceOrientationStrip";
import { PILOT_FEEDBACK_HELP_SOURCES } from "@/lib/pilot-feedback-help-evidence-copy";

describe("PilotFeedbackHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and follow-up links", () => {
    render(<PilotFeedbackHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBand(screen, "help-pilot-feedback-claim-discipline".slice(0, -"-claim-discipline".length), "help-pilot-feedback-claim-discipline");
    expect(screen.getByTestId("help-pilot-feedback-sources")).toBeInTheDocument();

    for (const link of PILOT_FEEDBACK_HELP_SOURCES) {
      expectFollowUpLink(screen, link);
    }
  });
});
