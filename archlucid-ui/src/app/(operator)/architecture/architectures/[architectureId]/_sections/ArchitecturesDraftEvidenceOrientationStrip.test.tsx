import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitecturesDraftEvidenceOrientationStrip } from "@/app/(operator)/architecture/architectures/[architectureId]/_sections/ArchitecturesDraftEvidenceOrientationStrip";
import { ARCHITECTURES_DRAFT_SOURCES } from "@/lib/architectures-draft-evidence-copy";
import { architectureDraftPath } from "@/lib/architecture-routes";

describe("ArchitecturesDraftEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking a draft detail id", () => {
    render(<ArchitecturesDraftEvidenceOrientationStrip />);

    expect(screen.getByTestId("architectures-draft-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architectures-draft-claim-discipline")).toBeInTheDocument();

    for (const link of ARCHITECTURES_DRAFT_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      ARCHITECTURES_DRAFT_SOURCES.some((link) => link.href === architectureDraftPath("draft-abc")),
    ).toBe(false);
  });
});
