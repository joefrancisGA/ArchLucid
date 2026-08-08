import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubprocessorsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/SubprocessorsHelpEvidenceOrientationStrip";
import {
  SUBPROCESSORS_HELP_CANONICAL_PATH,
  SUBPROCESSORS_HELP_SOURCES,
} from "@/lib/subprocessors-help-evidence-copy";

describe("SubprocessorsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking subprocessors help", () => {
    render(<SubprocessorsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("subprocessors-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("subprocessors-help-claim-discipline")).toBeInTheDocument();

    for (const link of SUBPROCESSORS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SUBPROCESSORS_HELP_SOURCES.some((link) => link.href === SUBPROCESSORS_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
