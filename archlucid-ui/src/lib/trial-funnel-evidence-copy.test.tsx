import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrialFunnelEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TRIAL_FUNNEL_CANONICAL_PATH,
  TRIAL_FUNNEL_FOLLOW_UPS_TITLE,
  TRIAL_FUNNEL_SOURCES,
  TRIAL_FUNNEL_SOURCES_INTRO,
} from "@/lib/trial-funnel-evidence-copy";

describe("trial-funnel-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(TRIAL_FUNNEL_CANONICAL_PATH).toBe("/internal/trial-funnel");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TrialFunnelEvidenceOrientationStrip />);

    expect(screen.queryByTestId("trial-funnel-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(TRIAL_FUNNEL_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("trial-funnel-sources");

    for (const link of TRIAL_FUNNEL_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${TRIAL_FUNNEL_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<TrialFunnelEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: TRIAL_FUNNEL_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
