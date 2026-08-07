import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrialFunnelEvidenceOrientationStrip } from "@/app/(operator)/internal/trial-funnel/_sections/TrialFunnelEvidenceOrientationStrip";
import { TRIAL_FUNNEL_CANONICAL_PATH, TRIAL_FUNNEL_SOURCES } from "@/lib/trial-funnel-evidence-copy";

describe("TrialFunnelEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking trial funnel", () => {
    render(<TrialFunnelEvidenceOrientationStrip />);

    expect(screen.getByTestId("trial-funnel-sources")).toBeInTheDocument();
    expect(screen.getByTestId("trial-funnel-claim-discipline")).toBeInTheDocument();

    for (const link of TRIAL_FUNNEL_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(TRIAL_FUNNEL_SOURCES.some((link) => link.href === TRIAL_FUNNEL_CANONICAL_PATH)).toBe(false);
  });
});
