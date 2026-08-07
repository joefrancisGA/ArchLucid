import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComparisonReplayHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/ComparisonReplayHelpEvidenceOrientationStrip";
import {
  COMPARISON_REPLAY_HELP_CANONICAL_PATH,
  COMPARISON_REPLAY_HELP_SOURCES,
} from "@/lib/comparison-replay-help-evidence-copy";

describe("ComparisonReplayHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking comparison-replay help", () => {
    render(<ComparisonReplayHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("comparison-replay-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-replay-help-claim-discipline")).toBeInTheDocument();

    for (const link of COMPARISON_REPLAY_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      COMPARISON_REPLAY_HELP_SOURCES.some((link) => link.href === COMPARISON_REPLAY_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
