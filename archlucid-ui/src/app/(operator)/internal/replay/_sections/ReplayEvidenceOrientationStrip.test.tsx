import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReplayEvidenceOrientationStrip } from "@/app/(operator)/replay/_sections/ReplayEvidenceOrientationStrip";
import {
  REPLAY_CANONICAL_PATH,
  REPLAY_CLAIM_DISCIPLINE,
  REPLAY_SOURCES,
  REPLAY_SOURCES_INTRO,
} from "@/lib/replay-evidence-copy";

describe("ReplayEvidenceOrientationStrip", () => {
  it("renders Sources and claim-discipline chrome", () => {
    render(<ReplayEvidenceOrientationStrip />);

    expect(screen.getByTestId("replay-sources")).toBeInTheDocument();
    expect(screen.getByTestId("replay-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(REPLAY_SOURCES_INTRO)).toBeInTheDocument();
    expect(screen.getByText(REPLAY_CLAIM_DISCIPLINE)).toBeInTheDocument();

    for (const link of REPLAY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(REPLAY_SOURCES.some((link) => link.href === REPLAY_CANONICAL_PATH)).toBe(false);
  });
});
