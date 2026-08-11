import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TeamsSlackNotificationVocabularyRail } from "@/components/TeamsSlackNotificationVocabularyRail";
import {
  TEAMS_SLACK_NOTIFICATION_COMPACT_LINE,
  TEAMS_SLACK_NOTIFICATION_HEADING,
  TEAMS_SLACK_NOTIFICATION_SLACK_LINK,
  TEAMS_SLACK_NOTIFICATION_TEAMS_LINK,
  TEAMS_SLACK_NOTIFICATION_WHY_TWO,
} from "@/lib/vocabulary/teams-slack-notification-vocabulary";

describe("TeamsSlackNotificationVocabularyRail (TB-2247)", () => {
  it("renders hub strip with both Teams and Slack links", () => {
    render(<TeamsSlackNotificationVocabularyRail currentSurfaceId="notifications-hub" />);

    const strip = screen.getByTestId("teams-slack-notification-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "notifications-hub");
    expect(strip.textContent ?? "").toContain(TEAMS_SLACK_NOTIFICATION_COMPACT_LINE);

    const teams = screen.getByTestId("teams-slack-notification-vocabulary-teams-link");
    expect(teams).toHaveTextContent(TEAMS_SLACK_NOTIFICATION_TEAMS_LINK.label);
    expect(teams).toHaveAttribute("href", TEAMS_SLACK_NOTIFICATION_TEAMS_LINK.href);

    const slack = screen.getByTestId("teams-slack-notification-vocabulary-slack-link");
    expect(slack).toHaveTextContent(TEAMS_SLACK_NOTIFICATION_SLACK_LINK.label);
    expect(slack).toHaveAttribute("href", TEAMS_SLACK_NOTIFICATION_SLACK_LINK.href);
  });

  it("renders Teams strip with peer link to Slack", () => {
    render(<TeamsSlackNotificationVocabularyRail currentSurfaceId="teams" />);

    expect(screen.getByTestId("teams-slack-notification-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "teams",
    );

    const peer = screen.getByTestId("teams-slack-notification-vocabulary-peer-link");
    expect(peer).toHaveTextContent(TEAMS_SLACK_NOTIFICATION_SLACK_LINK.label);
    expect(peer).toHaveAttribute("href", TEAMS_SLACK_NOTIFICATION_SLACK_LINK.href);
  });

  it("renders Slack strip with peer link to Teams", () => {
    render(<TeamsSlackNotificationVocabularyRail currentSurfaceId="slack" />);

    const peer = screen.getByTestId("teams-slack-notification-vocabulary-peer-link");
    expect(peer).toHaveTextContent(TEAMS_SLACK_NOTIFICATION_TEAMS_LINK.label);
    expect(peer).toHaveAttribute("href", TEAMS_SLACK_NOTIFICATION_TEAMS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <TeamsSlackNotificationVocabularyRail currentSurfaceId="teams" variant="full" />,
    );

    const strip = screen.getByTestId("teams-slack-notification-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(TEAMS_SLACK_NOTIFICATION_HEADING)).toBeInTheDocument();
    expect(screen.getByText(TEAMS_SLACK_NOTIFICATION_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("teams-slack-notification-vocabulary-current")).toHaveTextContent(
      TEAMS_SLACK_NOTIFICATION_TEAMS_LINK.label,
    );
  });
});
