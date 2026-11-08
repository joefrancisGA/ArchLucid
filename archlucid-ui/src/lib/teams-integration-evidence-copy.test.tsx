import { render, screen, within } from "@testing-library/react";
import { describe, expect, it , vi} from "vitest";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

import { TeamsIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TEAMS_INTEGRATION_CANONICAL_PATH,
  TEAMS_INTEGRATION_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_SOURCES,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

describe("teams-integration-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(TEAMS_INTEGRATION_CANONICAL_PATH).toBe("/integrations/teams");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TeamsIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("teams-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(TEAMS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("teams-integration-sources");

    expectWhereToGoNextFollowUpLinks(within(sources), TEAMS_INTEGRATION_SOURCES, TEAMS_INTEGRATION_CANONICAL_PATH);

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${TEAMS_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<TeamsIntegrationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: TEAMS_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});
