import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PilotOutcomesEvidenceOrientationStrip } from "@/app/(operator)/sponsor-report/pilot-outcomes/_sections/PilotOutcomesEvidenceOrientationStrip";
import {
  PILOT_OUTCOMES_CANONICAL_PATH,
  PILOT_OUTCOMES_SOURCES,
} from "@/lib/pilot-outcomes-evidence-copy";

describe("PilotOutcomesEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking pilot outcomes", () => {
    render(<PilotOutcomesEvidenceOrientationStrip />);

    expect(screen.getByTestId("pilot-outcomes-sources")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-outcomes-claim-discipline")).toBeInTheDocument();

    for (const link of PILOT_OUTCOMES_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PILOT_OUTCOMES_SOURCES.some((link) => link.href === PILOT_OUTCOMES_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
