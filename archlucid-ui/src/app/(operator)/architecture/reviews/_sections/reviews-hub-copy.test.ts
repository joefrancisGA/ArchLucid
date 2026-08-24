import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL,
  REVIEWS_HUB_SUMMARY_EMPTY_HINT,
} from "./reviews-hub-copy";

const BANNED_PACKAGE_PHRASES = [
  "architecture package",
  "sample package",
] as const;

describe("reviews-hub-copy", () => {
  it("centers the hub on managing architecture reviews", () => {
    expect(REVIEWS_HUB_PAGE_TITLE).toBe("Reviews");
    expect(REVIEWS_HUB_PAGE_SUBTITLE).toBe("Create, refine, evaluate, and approve architecture reviews.");
    expect(REVIEWS_HUB_RECENT_EMPTY_TITLE).toBe("No reviews yet");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY.toLowerCase()).toContain("findings");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY.toLowerCase()).toContain("approval");
    expect(REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE).toBe("No reviews yet");
    expect(REVIEWS_HUB_RESUME_DRAFTS_TITLE).toBe("Architectures ready for review");
    expect(REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL).toBe("Ready for review");
    expect(REVIEWS_HUB_SUMMARY_EMPTY_HINT.toLowerCase()).toContain("ready for review");
  });

  it("avoids retired package terminology in hub copy", () => {
    const hubCopy = [
      REVIEWS_HUB_PAGE_TITLE,
      REVIEWS_HUB_PAGE_SUBTITLE,
      REVIEWS_HUB_RECENT_EMPTY_TITLE,
      REVIEWS_HUB_RECENT_EMPTY_BODY,
      REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
      REVIEWS_HUB_RESUME_DRAFTS_TITLE,
      REVIEWS_HUB_SUMMARY_EMPTY_HINT,
    ]
      .join(" ")
      .toLowerCase();

    for (const phrase of BANNED_PACKAGE_PHRASES) {
      expect(hubCopy, `should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
