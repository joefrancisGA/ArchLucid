import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectClaimDisciplineBandContent, expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { RepeatReviewLoopHelpEvidenceOrientationStrip } from "@/components/help/RepeatReviewLoopHelpEvidenceOrientationStrip";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";

describe("RepeatReviewLoopHelpEvidenceOrientationStrip", () => {
  it("renders Sources follow-up links without duplicate claim discipline when omitted", () => {
    render(<RepeatReviewLoopHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("repeat-review-loop-help-orientation")).toBeInTheDocument();
    expectClaimDisciplineBandContent(
      screen,
      "repeat-review-loop-help",
      "repeat-review-loop-help-claim-discipline",
      REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    for (const source of REPEAT_REVIEW_LOOP_HELP_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});
