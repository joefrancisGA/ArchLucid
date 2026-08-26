import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectClaimDisciplineBandContent, expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ComparisonReplayHelpEvidenceOrientationStrip } from "@/components/help/ComparisonReplayHelpEvidenceOrientationStrip";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_SOURCES,
} from "@/lib/comparison-replay-help-evidence-copy";

describe("ComparisonReplayHelpEvidenceOrientationStrip", () => {
  it("renders Sources follow-up links without duplicate claim discipline when omitted", () => {
    render(<ComparisonReplayHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("comparison-replay-help-orientation")).toBeInTheDocument();
    expectClaimDisciplineBandContent(
      screen,
      "comparison-replay-help",
      "comparison-replay-help-claim-discipline",
      COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    for (const source of COMPARISON_REPLAY_HELP_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});
