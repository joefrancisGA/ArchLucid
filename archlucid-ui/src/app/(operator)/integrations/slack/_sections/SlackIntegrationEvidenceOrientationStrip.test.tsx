import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SlackIntegrationEvidenceOrientationStrip } from "@/app/(operator)/integrations/slack/_sections/SlackIntegrationEvidenceOrientationStrip";
import {
  SLACK_INTEGRATION_CANONICAL_PATH,
  SLACK_INTEGRATION_SOURCES,
} from "@/lib/slack-integration-evidence-copy";

describe("SlackIntegrationEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking Slack integration", () => {
    render(<SlackIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("slack-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("slack-integration-claim-discipline")).toBeInTheDocument();

    for (const link of SLACK_INTEGRATION_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SLACK_INTEGRATION_SOURCES.some((link) => link.href === SLACK_INTEGRATION_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
