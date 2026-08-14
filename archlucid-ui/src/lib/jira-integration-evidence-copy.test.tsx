import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JiraIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  JIRA_INTEGRATION_CANONICAL_PATH,
  JIRA_INTEGRATION_FOLLOW_UPS_TITLE,
  JIRA_INTEGRATION_SOURCES,
  JIRA_INTEGRATION_SOURCES_INTRO,
} from "@/lib/jira-integration-evidence-copy";

describe("jira-integration-evidence-copy", () => {
  it("wires exports into the Jira integration evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("jira-integration-evidence-copy");
    expect(registrySource).toContain("JiraIntegrationEvidenceOrientationStrip");
    expect(JIRA_INTEGRATION_CANONICAL_PATH).toBe("/integrations/jira");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<JiraIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("jira-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(JIRA_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("jira-integration-sources");

    for (const link of JIRA_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
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
