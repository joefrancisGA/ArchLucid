import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JiraIntegrationEvidenceOrientationStrip } from "@/app/(operator)/integrations/_sections/itsm/JiraIntegrationEvidenceOrientationStrip";
import {
  JIRA_INTEGRATION_CANONICAL_PATH,
  JIRA_INTEGRATION_SOURCES,
} from "@/lib/jira-integration-evidence-copy";

describe("JiraIntegrationEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Jira integration", () => {
    render(<JiraIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("jira-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("jira-integration-claim-discipline")).toBeInTheDocument();

    for (const link of JIRA_INTEGRATION_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(JIRA_INTEGRATION_SOURCES.some((link) => link.href === JIRA_INTEGRATION_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
