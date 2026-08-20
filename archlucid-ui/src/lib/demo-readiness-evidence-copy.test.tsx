import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { DemoReadinessEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  DEMO_READINESS_CANONICAL_PATH,
  DEMO_READINESS_FOLLOW_UPS_TITLE,
  DEMO_READINESS_SOURCES,
  DEMO_READINESS_SOURCES_INTRO,
} from "@/lib/demo-readiness-evidence-copy";

describe("demo-readiness-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(DEMO_READINESS_CANONICAL_PATH).toBe("/internal/demo-readiness");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<DemoReadinessEvidenceOrientationStrip />);

    expect(screen.queryByTestId("demo-readiness-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(DEMO_READINESS_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("demo-readiness-sources");

    for (const link of DEMO_READINESS_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${DEMO_READINESS_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<DemoReadinessEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: DEMO_READINESS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
