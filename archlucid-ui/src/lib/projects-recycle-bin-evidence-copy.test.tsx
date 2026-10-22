import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  expectWhereToGoNextFollowUpLinks,
} from "@/lib/claim-discipline-test-helpers";

import { ProjectsRecycleBinEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  PROJECTS_RECYCLE_BIN_CANONICAL_PATH,
  PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE,
  PROJECTS_RECYCLE_BIN_SOURCES,
  PROJECTS_RECYCLE_BIN_SOURCES_INTRO,
} from "@/lib/projects-recycle-bin-evidence-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("projects-recycle-bin-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(PROJECTS_RECYCLE_BIN_CANONICAL_PATH).toBe("/administration/workspace-settings/recycle-bin");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<ProjectsRecycleBinEvidenceOrientationStrip />);

    expect(screen.queryByTestId("projects-recycle-bin-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(PROJECTS_RECYCLE_BIN_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("projects-recycle-bin-sources");

    expectWhereToGoNextFollowUpLinks(within(sources), PROJECTS_RECYCLE_BIN_SOURCES);

    expect(
      within(sources).queryByRole("link", {
        name: formatHelpFollowUpLinkAccessibleName(
          "/administration/workspace-settings",
          "Tenant settings",
        ),
      }),
    ).not.toBeInTheDocument();

    expect(
      within(sources).queryByRole("link", {
        name: formatHelpFollowUpLinkAccessibleName("/administration/users", "Users"),
      }),
    ).not.toBeInTheDocument();

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${PROJECTS_RECYCLE_BIN_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<ProjectsRecycleBinEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
