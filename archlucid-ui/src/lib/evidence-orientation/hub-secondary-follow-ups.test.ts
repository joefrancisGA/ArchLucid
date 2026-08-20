import { describe, expect, it } from "vitest";

import {
  HUB_RELATED_GUIDES_FOLLOW_UPS_TITLE,
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  HUB_SECONDARY_SOURCES_LAYOUT,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";

describe("hub-secondary-follow-ups", () => {
  it("uses the same columns layout as Where to go next strips", () => {
    expect(HUB_SECONDARY_SOURCES_LAYOUT).toBe("columns");
  });

  it("builds intro copy that defers to primary workspace actions", () => {
    expect(hubSecondaryFollowUpsIntro("queue triage turns into trails")).toBe(
      "Use these when queue triage turns into trails. Primary actions on this page come first.",
    );
  });

  it("publishes contextual titles per hub surface", () => {
    expect(HUB_RELATED_GUIDES_FOLLOW_UPS_TITLE).toBe("Related Guides");
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.reviewsNew).toBe(HUB_RELATED_GUIDES_FOLLOW_UPS_TITLE);
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.cloudConnections).toBe(HUB_RELATED_GUIDES_FOLLOW_UPS_TITLE);
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.settingsHub).toBe("Related administration");
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.operatorHome).toBe("After a review");
  });
});
