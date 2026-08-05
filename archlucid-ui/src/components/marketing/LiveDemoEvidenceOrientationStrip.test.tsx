import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveDemoEvidenceOrientationStrip } from "@/components/marketing/LiveDemoEvidenceOrientationStrip";
import { LIVE_DEMO_CANONICAL_PATH, LIVE_DEMO_SOURCES } from "@/lib/live-demo-evidence-copy";

describe("LiveDemoEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking live-demo", () => {
    render(<LiveDemoEvidenceOrientationStrip />);

    expect(screen.getByTestId("live-demo-sources")).toBeInTheDocument();
    expect(screen.getByTestId("live-demo-claim-discipline")).toBeInTheDocument();

    for (const link of LIVE_DEMO_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(LIVE_DEMO_SOURCES.some((link) => link.href === LIVE_DEMO_CANONICAL_PATH)).toBe(false);
  });
});
