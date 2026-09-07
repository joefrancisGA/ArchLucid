import { describe, expect, it } from "vitest";

import {
  REVIEWS_HUB_ARCHITECTURE_INPUT_HINT,
  REVIEWS_HUB_PAGE_SUBTITLE,
  REVIEWS_HUB_PAGE_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_DRAFT_TITLE,
  REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY,
  REVIEWS_HUB_RESUME_DRAFTS_TITLE,
  REVIEWS_HUB_SUMMARY_DRAFTS_READY_LABEL,
  REVIEWS_HUB_SUMMARY_EMPTY_COUNTS_HINT,
  REVIEWS_HUB_SUMMARY_EMPTY_HINT,
  WORKING_REVIEWS_HUB_PAGE_SUBTITLE,
  WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY,
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
    expect(REVIEWS_HUB_SUMMARY_EMPTY_COUNTS_HINT.toLowerCase()).toContain("ready for review");
  });

  it("lets a review start from described or imported architecture, not only an in-app draft", () => {
    expect(REVIEWS_HUB_ARCHITECTURE_INPUT_HINT.toLowerCase()).toContain("describe or import");
    expect(REVIEWS_HUB_RECENT_EMPTY_BODY).toContain(REVIEWS_HUB_ARCHITECTURE_INPUT_HINT);
    expect(REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY.toLowerCase()).toContain(
      "description or imported documents",
    );
    expect(REVIEWS_HUB_RECENT_EMPTY_WITH_SOLE_DRAFT_BODY.toLowerCase()).not.toContain(
      "then start a review when ready",
    );
  });

  it("AO-26: frames Working inbox copy separately from Guided portfolio language", () => {
    expect(WORKING_REVIEWS_HUB_PAGE_SUBTITLE.toLowerCase()).toContain("cross-architecture");
    expect(WORKING_REVIEWS_HUB_RECENT_EMPTY_BODY.toLowerCase()).toContain("open architectures");
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
