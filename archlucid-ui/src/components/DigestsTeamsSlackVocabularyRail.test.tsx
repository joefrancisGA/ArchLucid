import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsTeamsSlackVocabularyRail } from "@/components/DigestsTeamsSlackVocabularyRail";
import {
  DIGESTS_TEAMS_SLACK_COMPACT_LINE,
  DIGESTS_TEAMS_SLACK_DIGESTS_LINK,
  DIGESTS_TEAMS_SLACK_HEADING,
  DIGESTS_TEAMS_SLACK_SLACK_LINK,
  DIGESTS_TEAMS_SLACK_TEAMS_LINK,
  DIGESTS_TEAMS_SLACK_WHY_THREE,
} from "@/lib/vocabulary/digests-teams-slack-vocabulary";

describe("DigestsTeamsSlackVocabularyRail (TB-2325)", () => {
  it("renders digests strip with peers to Teams and Slack", () => {
    render(<DigestsTeamsSlackVocabularyRail currentSurfaceId="digests" />);

    const strip = screen.getByTestId("digests-teams-slack-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "digests");
    expect(strip.textContent ?? "").toBe(DIGESTS_TEAMS_SLACK_COMPACT_LINE);

    expect(screen.getByRole("link", { name: /^Teams$/ })).toHaveAttribute(
      "href",
      DIGESTS_TEAMS_SLACK_TEAMS_LINK.href,
    );
    expect(screen.getByRole("link", { name: /^Slack$/ })).toHaveAttribute(
      "href",
      DIGESTS_TEAMS_SLACK_SLACK_LINK.href,
    );
  });

  it("inlines Digests and Slack on the Teams page", () => {
    render(<DigestsTeamsSlackVocabularyRail currentSurfaceId="teams" />);

    expect(screen.getByRole("link", { name: /^Digests$/ })).toHaveAttribute(
      "href",
      DIGESTS_TEAMS_SLACK_DIGESTS_LINK.href,
    );
    expect(screen.getByRole("link", { name: /^Slack$/ })).toHaveAttribute(
      "href",
      DIGESTS_TEAMS_SLACK_SLACK_LINK.href,
    );
    expect(screen.queryByRole("link", { name: /^Teams$/ })).toBeNull();
  });

  it("renders full variant on Teams with digests peer", () => {
    render(<DigestsTeamsSlackVocabularyRail currentSurfaceId="teams" variant="full" />);

    expect(screen.getByText(DIGESTS_TEAMS_SLACK_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_TEAMS_SLACK_WHY_THREE)).toBeInTheDocument();
    expect(screen.getByTestId("digests-teams-slack-vocabulary-current")).toHaveTextContent(
      DIGESTS_TEAMS_SLACK_TEAMS_LINK.label,
    );
    expect(screen.getByTestId("digests-teams-slack-vocabulary-peer-digests")).toHaveAttribute(
      "href",
      DIGESTS_TEAMS_SLACK_DIGESTS_LINK.href,
    );
  });
});
