import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

import { JiraIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  JIRA_INTEGRATION_CANONICAL_PATH,
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_SOURCES,
  JIRA_INTEGRATION_SOURCES_INTRO,
} from "@/lib/jira-integration-evidence-copy";

describe("jira-integration-evidence-copy", () => {
  it("publishes its canonical operator path", () => {
    expect(JIRA_INTEGRATION_CANONICAL_PATH).toBe("/integrations/jira");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<JiraIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("jira-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(JIRA_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("jira-integration-sources");

    for (const link of JIRA_INTEGRATION_SOURCES) {
      expectFollowUpLink(within(sources), link);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${JIRA_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<JiraIntegrationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: JIRA_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});
