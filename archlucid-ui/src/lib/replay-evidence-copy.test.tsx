import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { ReplayEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  REPLAY_CANONICAL_PATH,
  REPLAY_FOLLOW_UPS_TITLE,
  REPLAY_SOURCES,
  REPLAY_SOURCES_INTRO,
} from "@/lib/replay-evidence-copy";

describe("replay-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(REPLAY_CANONICAL_PATH).toBe("/internal/validate-route");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<ReplayEvidenceOrientationStrip />);

    expect(screen.queryByTestId("validate-route-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(REPLAY_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("validate-route-sources");

    for (const link of REPLAY_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${REPLAY_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<ReplayEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: REPLAY_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
