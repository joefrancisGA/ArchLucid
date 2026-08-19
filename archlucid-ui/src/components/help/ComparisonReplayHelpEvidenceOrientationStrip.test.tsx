import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComparisonReplayHelpEvidenceOrientationStrip } from "@/components/help/ComparisonReplayHelpEvidenceOrientationStrip";
import {
  COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
  COMPARISON_REPLAY_HELP_SOURCES,
} from "@/lib/comparison-replay-help-evidence-copy";

describe("ComparisonReplayHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline and Sources follow-up links", () => {
    render(<ComparisonReplayHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("comparison-replay-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-replay-help-claim-discipline")).toHaveTextContent(
      COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE,
    );

    for (const source of COMPARISON_REPLAY_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });
});
