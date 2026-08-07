import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesNewEvidenceOrientationStrip } from "@/app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewEvidenceOrientationStrip";
import {
  ARCHITECTURES_NEW_CANONICAL_PATH,
  ARCHITECTURES_NEW_SOURCES,
} from "@/lib/architectures-new-evidence-copy";

describe("ArchitecturesNewEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Create architecture", () => {
    render(<ArchitecturesNewEvidenceOrientationStrip />);

    expect(screen.getByTestId("architectures-new-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architectures-new-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURES_NEW_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ARCHITECTURES_NEW_SOURCES.some((link) => link.href === ARCHITECTURES_NEW_CANONICAL_PATH),
    ).toBe(false);
  });
});
