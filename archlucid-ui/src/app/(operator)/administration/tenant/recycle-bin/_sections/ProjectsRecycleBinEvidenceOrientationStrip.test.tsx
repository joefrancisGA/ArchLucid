import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectsRecycleBinEvidenceOrientationStrip } from "@/app/(operator)/administration/tenant/recycle-bin/_sections/ProjectsRecycleBinEvidenceOrientationStrip";
import {
  PROJECTS_RECYCLE_BIN_CANONICAL_PATH,
  PROJECTS_RECYCLE_BIN_SOURCES,
} from "@/lib/projects-recycle-bin-evidence-copy";

describe("ProjectsRecycleBinEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Projects recycle bin", () => {
    render(<ProjectsRecycleBinEvidenceOrientationStrip />);

    expect(screen.getByTestId("projects-recycle-bin-sources")).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-claim-discipline")).toBeInTheDocument();

    for (const link of PROJECTS_RECYCLE_BIN_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      PROJECTS_RECYCLE_BIN_SOURCES.some((link) => link.href === PROJECTS_RECYCLE_BIN_CANONICAL_PATH),
    ).toBe(false);
  });
});
