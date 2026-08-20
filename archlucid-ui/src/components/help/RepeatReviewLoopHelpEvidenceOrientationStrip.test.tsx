import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { RepeatReviewLoopHelpEvidenceOrientationStrip } from "@/components/help/RepeatReviewLoopHelpEvidenceOrientationStrip";
import {
  REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";

describe("RepeatReviewLoopHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-up links", () => {
    render(<RepeatReviewLoopHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("repeat-review-loop-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-review-loop-help-claim-discipline")).toHaveTextContent(
      REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE,
    );

    for (const source of REPEAT_REVIEW_LOOP_HELP_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});
