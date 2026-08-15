import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TeamsIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  TEAMS_INTEGRATION_CANONICAL_PATH,
  TEAMS_INTEGRATION_FOLLOW_UPS_TITLE,
  TEAMS_INTEGRATION_SOURCES,
  TEAMS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/teams-integration-evidence-copy";

describe("teams-integration-evidence-copy", () => {
  it("wires exports into the Teams integration evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("teams-integration-evidence-copy");
    expect(registrySource).toContain("TeamsIntegrationEvidenceOrientationStrip");
    expect(TEAMS_INTEGRATION_CANONICAL_PATH).toBe("/integrations/teams");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<TeamsIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("teams-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(TEAMS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("teams-integration-sources");

    for (const link of TEAMS_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

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
