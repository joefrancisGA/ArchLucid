import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
} from "./reviews-hub-copy";

const REVIEW_ONLY_EMPTY_PHRASES = [
  "start an architecture review from a brief",
  "no review packages yet",
] as const;

describe("reviews-hub-copy", () => {
  it("TB-738: uses architecture package as the hub list noun", () => {
    expect(REVIEWS_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("architecture package");
    expect(REVIEWS_HUB_RECENT_EMPTY_TITLE).toBe("No architecture packages yet");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY.toLowerCase()).toContain("create or review an architecture");
  });

  it("TB-738: hub empty copy avoids review-only list phrases", () => {
    const emptyCopy = `${REVIEWS_HUB_RECENT_EMPTY_TITLE} ${REVIEWS_HUB_RECENT_EMPTY_BODY}`.toLowerCase();

    for (const phrase of REVIEW_ONLY_EMPTY_PHRASES) {
      expect(emptyCopy, `should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
