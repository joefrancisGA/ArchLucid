import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectsRecycleDraftsPackageVocabularyRail } from "@/components/ProjectsRecycleDraftsPackageVocabularyRail";
import {
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_COMPACT_LINE,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_HEADING,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_WHY_THREE,
} from "@/lib/projects-recycle-drafts-package-vocabulary";

describe("ProjectsRecycleDraftsPackageVocabularyRail (TB-2251)", () => {
  it("renders compact strip on recycle with peer links to drafts and packages", () => {
    render(
      <ProjectsRecycleDraftsPackageVocabularyRail currentSurfaceId="projects-recycle" />,
    );

    const strip = screen.getByTestId("projects-recycle-drafts-package-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "projects-recycle");
    expect(strip.textContent ?? "").toContain(PROJECTS_RECYCLE_DRAFTS_PACKAGE_COMPACT_LINE);

    const draftsPeer = screen.getByTestId(
      "projects-recycle-drafts-package-vocabulary-peer-architecture-drafts",
    );
    expect(draftsPeer).toHaveTextContent(PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK.label);
    expect(draftsPeer).toHaveAttribute("href", PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK.href);

    const packagePeer = screen.getByTestId(
      "projects-recycle-drafts-package-vocabulary-peer-architecture-packages",
    );
    expect(packagePeer).toHaveTextContent(PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK.label);
    expect(packagePeer).toHaveAttribute("href", PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK.href);
  });

  it("renders compact strip on drafts with peer links to recycle and packages", () => {
    render(
      <ProjectsRecycleDraftsPackageVocabularyRail currentSurfaceId="architecture-drafts" />,
    );

    expect(screen.getByTestId("projects-recycle-drafts-package-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "architecture-drafts",
    );

    const recyclePeer = screen.getByTestId(
      "projects-recycle-drafts-package-vocabulary-peer-projects-recycle",
    );
    expect(recyclePeer).toHaveTextContent(PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK.label);
    expect(recyclePeer).toHaveAttribute("href", PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK.href);
  });

  it("renders full variant with why-three, honesty, and triad cards", () => {
    render(
      <ProjectsRecycleDraftsPackageVocabularyRail
        currentSurfaceId="projects-recycle"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("projects-recycle-drafts-package-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(PROJECTS_RECYCLE_DRAFTS_PACKAGE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(PROJECTS_RECYCLE_DRAFTS_PACKAGE_WHY_THREE)).toBeInTheDocument();
    expect(
      screen.getByTestId("projects-recycle-drafts-package-vocabulary-honesty"),
    ).toHaveTextContent(PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY);
    expect(
      screen.getByTestId("projects-recycle-drafts-package-vocabulary-job-projects-recycle"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("projects-recycle-drafts-package-vocabulary-job-architecture-drafts"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("projects-recycle-drafts-package-vocabulary-job-architecture-packages"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("projects-recycle-drafts-package-vocabulary-current"),
    ).toHaveTextContent(PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK.label);
  });
});
