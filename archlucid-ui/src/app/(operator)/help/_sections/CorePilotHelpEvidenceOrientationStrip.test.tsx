import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CorePilotHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/CorePilotHelpEvidenceOrientationStrip";
import {
  CORE_PILOT_HELP_CANONICAL_PATH,
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";

describe("CorePilotHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking first-architecture-review help", () => {
    render(<CorePilotHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("core-pilot-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-help-claim-discipline")).toBeInTheDocument();

    for (const link of CORE_PILOT_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(CORE_PILOT_HELP_SOURCES.some((link) => link.href === CORE_PILOT_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
