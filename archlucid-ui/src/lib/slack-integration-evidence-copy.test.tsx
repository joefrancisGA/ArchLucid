import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SlackIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  SLACK_INTEGRATION_CANONICAL_PATH,
  SLACK_INTEGRATION_FOLLOW_UPS_TITLE,
  SLACK_INTEGRATION_SOURCES,
  SLACK_INTEGRATION_SOURCES_INTRO,
} from "@/lib/slack-integration-evidence-copy";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";

describe("slack-integration-evidence-copy", () => {
  it("wires exports into the Slack integration evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("slack-integration-evidence-copy");
    expect(registrySource).toContain("SlackIntegrationEvidenceOrientationStrip");
    expect(SLACK_INTEGRATION_CANONICAL_PATH).toBe("/integrations/slack");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<SlackIntegrationEvidenceOrientationStrip />);

    expect(screen.queryByTestId("slack-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(SLACK_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("slack-integration-sources");

    for (const link of SLACK_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${SLACK_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<SlackIntegrationEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: SLACK_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});
