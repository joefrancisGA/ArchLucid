import { describe, expect, it } from "vitest";

import {
  DIGESTS_TEAMS_SLACK_COMPACT_LINE,
  DIGESTS_TEAMS_SLACK_DIGESTS_LINK,
  DIGESTS_TEAMS_SLACK_HEADING,
  DIGESTS_TEAMS_SLACK_SLACK_LINK,
  DIGESTS_TEAMS_SLACK_TEAMS_LINK,
  DIGESTS_TEAMS_SLACK_WHY_THREE,
  buildDigestsTeamsSlackVocabulary,
  resolveDigestsTeamsSlackLink,
  resolveDigestsTeamsSlackPeerLinks,
} from "@/lib/vocabulary/digests-teams-slack-vocabulary";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import {
  INTEGRATIONS_SLACK_PATH,
  INTEGRATIONS_TEAMS_PATH,
} from "@/lib/integrations-nav-paths";

const BANNED_NOTIFICATION_RAIL_TERMS = [/\bjob\b/i, /\bproduct\b/i];

describe("digests-teams-slack-vocabulary (TB-2325)", () => {
  it("explains digest email cadence vs Teams and Slack alert channels", () => {
    const model = buildDigestsTeamsSlackVocabulary();

    expect(model.heading).toBe(DIGESTS_TEAMS_SLACK_HEADING);
    expect(model.whyThree).toBe(DIGESTS_TEAMS_SLACK_WHY_THREE);
    expect(model.whyThree.toLowerCase()).toContain("email");
    expect(model.whyThree.toLowerCase()).toContain("teams");
    expect(model.compactLine).toBe(DIGESTS_TEAMS_SLACK_COMPACT_LINE);

    expect(model.digestsLink.href).toBe(DIGESTS_HUB_PATH);
    expect(model.teamsLink.href).toBe(INTEGRATIONS_TEAMS_PATH);
    expect(model.slackLink.href).toBe(INTEGRATIONS_SLACK_PATH);
  });

  it("resolves current and peer links for each triad surface", () => {
    expect(resolveDigestsTeamsSlackLink("digests")).toEqual(DIGESTS_TEAMS_SLACK_DIGESTS_LINK);
    expect(resolveDigestsTeamsSlackPeerLinks("digests")).toEqual([
      DIGESTS_TEAMS_SLACK_TEAMS_LINK,
      DIGESTS_TEAMS_SLACK_SLACK_LINK,
    ]);
    expect(resolveDigestsTeamsSlackPeerLinks("teams")).toHaveLength(2);
    expect(resolveDigestsTeamsSlackPeerLinks("slack")).toHaveLength(2);
  });

  it("keeps customer-facing rail copy free of banned job and product wording", () => {
    const surfaces = [
      DIGESTS_TEAMS_SLACK_WHY_THREE,
      DIGESTS_TEAMS_SLACK_COMPACT_LINE,
      DIGESTS_TEAMS_SLACK_DIGESTS_LINK.whenToUse,
      DIGESTS_TEAMS_SLACK_TEAMS_LINK.whenToUse,
      DIGESTS_TEAMS_SLACK_SLACK_LINK.whenToUse,
    ];

    for (const surface of surfaces) {
      for (const pattern of BANNED_NOTIFICATION_RAIL_TERMS) {
        expect(surface, `banned notification-rail term in: ${surface}`).not.toMatch(pattern);
      }
    }
  });
});
