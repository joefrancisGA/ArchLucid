import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectClaimDisciplineBand,
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { PilotFeedbackHelpEvidenceOrientationStrip } from "@/components/help/PilotFeedbackHelpEvidenceOrientationStrip";
import { PILOT_FEEDBACK_HELP_SOURCES } from "@/lib/pilot-feedback-help-evidence-copy";

describe("PilotFeedbackHelpEvidenceOrientationStrip", () => {
  it("renders follow-up links without duplicate claim discipline when omitted", () => {
    render(<PilotFeedbackHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBand(screen, "help-pilot-feedback", "help-pilot-feedback-claim-discipline");
    expect(screen.getByTestId("help-pilot-feedback-sources")).toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(screen, PILOT_FEEDBACK_HELP_SOURCES);
  });
});
