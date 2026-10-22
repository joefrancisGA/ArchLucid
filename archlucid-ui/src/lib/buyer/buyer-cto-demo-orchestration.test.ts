import { describe, expect, it, vi } from "vitest";

import {
  buyerCtoDemoAudienceCaption,
  formatDemoRelativeTimestamp,
  getBuyerCtoDemoJourneyStepHref,
  softRestartBuyerCtoDemoSession,
  BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO,
} from "@/lib/buyer/buyer-cto-demo-orchestration";
import { BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY } from "@/lib/buyer/buyer-cto-demo-tour";
import { getShowcaseSponsorHref } from "@/lib/buyer/buyer-safe-review-navigation";

describe("buyer-cto-demo-orchestration", () => {
  it("maps keyboard step numbers to journey hrefs", () => {
    expect(getBuyerCtoDemoJourneyStepHref(1)).toBe(getShowcaseSponsorHref());
    expect(getBuyerCtoDemoJourneyStepHref(6)).toBeNull();
  });

  it("returns audience captions for each step", () => {
    expect(buyerCtoDemoAudienceCaption(0)).toContain("Sponsor outcomes");
    expect(buyerCtoDemoAudienceCaption(4)).toContain("audit trail");
  });

  it("formats demo timestamps relative to the showcase anchor", () => {
    const anchor = new Date(BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO);
    const twoDaysBefore = new Date(anchor.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    expect(formatDemoRelativeTimestamp(twoDaysBefore, anchor)).toBe("2 days ago");
  });

  it("soft restart clears visited steps without network calls", async () => {
    sessionStorage.setItem(BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY, "[0,1]");

    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = softRestartBuyerCtoDemoSession();

    expect(result.destinationHref).toContain("ctoDemoTour=1");
    expect(sessionStorage.getItem(BUYER_CTO_DEMO_TOUR_VISITED_STEPS_STORAGE_KEY)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
