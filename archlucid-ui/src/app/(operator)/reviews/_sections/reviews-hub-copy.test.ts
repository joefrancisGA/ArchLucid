import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
} from "./reviews-hub-copy";

const BANNED_PACKAGE_PHRASES = [
  "review",
  "architecture package",
  "sample package",
] as const;

describe("reviews-hub-copy", () => {
  it("centers the hub on architecture reviews", () => {
    expect(REVIEWS_HUB_PAGE_TITLE).toBe("Reviews");
    expect(REVIEWS_HUB_PAGE_SUBTITLE).toBe("Create, refine, evaluate, and approve architecture reviews.");
    expect(REVIEWS_HUB_RECENT_EMPTY_TITLE).toBe("Start your first architecture review");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY.toLowerCase()).toContain("describe or import an architecture");
  });

  it("avoids retired package terminology in hub copy", () => {
    const hubCopy = [
      REVIEWS_HUB_PAGE_TITLE,
      REVIEWS_HUB_PAGE_SUBTITLE,
      REVIEWS_HUB_RECENT_EMPTY_TITLE,
      REVIEWS_HUB_RECENT_EMPTY_BODY,
    ]
      .join(" ")
      .toLowerCase();

    for (const phrase of BANNED_PACKAGE_PHRASES) {
      expect(hubCopy, `should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
