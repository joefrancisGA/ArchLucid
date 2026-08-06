import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesListEvidenceOrientationStrip } from "@/app/(operator)/architecture/architectures/_sections/ArchitecturesListEvidenceOrientationStrip";
import {
  ARCHITECTURES_LIST_CANONICAL_PATH,
  ARCHITECTURES_LIST_SOURCES,
} from "@/lib/architectures-list-evidence-copy";

describe("ArchitecturesListEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Architectures", () => {
    render(<ArchitecturesListEvidenceOrientationStrip />);

    expect(screen.getByTestId("architectures-list-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architectures-list-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURES_LIST_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ARCHITECTURES_LIST_SOURCES.some((link) => link.href === ARCHITECTURES_LIST_CANONICAL_PATH),
    ).toBe(false);
  });
});
