import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotFeedbackHelpEvidenceOrientationStrip } from "@/components/help/PilotFeedbackHelpEvidenceOrientationStrip";
import { PILOT_FEEDBACK_HELP_SOURCES } from "@/lib/pilot-feedback-help-evidence-copy";

describe("PilotFeedbackHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and follow-up links", () => {
    render(<PilotFeedbackHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("help-pilot-feedback-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("help-pilot-feedback-sources")).toBeInTheDocument();

    for (const link of PILOT_FEEDBACK_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });
});
