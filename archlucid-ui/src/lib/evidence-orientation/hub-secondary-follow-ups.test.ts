import { describe, expect, it } from "vitest";

import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  HUB_SECONDARY_SOURCES_LAYOUT,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";

describe("hub-secondary-follow-ups", () => {
  it("uses wrap layout for secondary hub follow-up rows", () => {
    expect(HUB_SECONDARY_SOURCES_LAYOUT).toBe("wrap");
  });

  it("builds intro copy that defers to primary workspace actions", () => {
    expect(hubSecondaryFollowUpsIntro("queue triage turns into trails")).toBe(
      "Use these when queue triage turns into trails. Primary actions on this page come first.",
    );
  });

  it("publishes contextual titles per hub surface", () => {
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.reviewsNew).toBe("Related guides");
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.settingsHub).toBe("Related administration");
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.operatorHome).toBe("After a review");
    expect(HUB_SECONDARY_FOLLOW_UPS_TITLES.cloudConnections).toBe("Related connections");
  });
});
