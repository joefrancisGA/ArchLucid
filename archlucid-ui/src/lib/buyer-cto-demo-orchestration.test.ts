import { describe, expect, it } from "vitest";

import {
  buyerCtoDemoAudienceCaption,
  formatDemoRelativeTimestamp,
  getBuyerCtoDemoJourneyStepHref,
  BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO,
} from "@/lib/buyer-cto-demo-orchestration";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

describe("buyer-cto-demo-orchestration", () => {
  it("maps keyboard step numbers to journey hrefs", () => {
    expect(getBuyerCtoDemoJourneyStepHref(1)).toBe(getShowcaseExecutiveHref());
    expect(getBuyerCtoDemoJourneyStepHref(6)).toBeNull();
  });

  it("returns audience captions for each step", () => {
    expect(buyerCtoDemoAudienceCaption(0)).toContain("executive outcomes");
    expect(buyerCtoDemoAudienceCaption(4)).toContain("audit trail");
  });

  it("formats demo timestamps relative to the showcase anchor", () => {
    const anchor = new Date(BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO);
    const twoDaysBefore = new Date(anchor.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    expect(formatDemoRelativeTimestamp(twoDaysBefore, anchor)).toBe("2 days ago");
  });
});
