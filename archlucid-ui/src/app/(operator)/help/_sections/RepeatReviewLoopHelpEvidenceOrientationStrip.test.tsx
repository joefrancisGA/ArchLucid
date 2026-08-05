import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RepeatReviewLoopHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/RepeatReviewLoopHelpEvidenceOrientationStrip";
import {
  REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH,
  REPEAT_REVIEW_LOOP_HELP_SOURCES,
} from "@/lib/repeat-review-loop-help-evidence-copy";

describe("RepeatReviewLoopHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking repeat-review-loop help", () => {
    render(<RepeatReviewLoopHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("repeat-review-loop-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("repeat-review-loop-help-claim-discipline")).toBeInTheDocument();

    for (const link of REPEAT_REVIEW_LOOP_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      REPEAT_REVIEW_LOOP_HELP_SOURCES.some(
        (link) => link.href === REPEAT_REVIEW_LOOP_HELP_CANONICAL_PATH,
      ),
    ).toBe(false);
  });
});
