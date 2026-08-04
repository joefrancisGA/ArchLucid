import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutiveScorecardEvidenceOrientationStrip } from "@/app/(executive)/executive/scorecard/_sections/ExecutiveScorecardEvidenceOrientationStrip";
import {
  EXECUTIVE_SCORECARD_CANONICAL_PATH,
  EXECUTIVE_SCORECARD_SOURCES,
} from "@/lib/executive-scorecard-evidence-copy";

describe("ExecutiveScorecardEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the scorecard", () => {
    render(<ExecutiveScorecardEvidenceOrientationStrip />);

    expect(screen.getByTestId("executive-scorecard-sources")).toBeInTheDocument();
    expect(screen.getByTestId("executive-scorecard-claim-discipline")).toBeInTheDocument();

    for (const link of EXECUTIVE_SCORECARD_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      EXECUTIVE_SCORECARD_SOURCES.some((link) => link.href === EXECUTIVE_SCORECARD_CANONICAL_PATH),
    ).toBe(false);
  });
});
