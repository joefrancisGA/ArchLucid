import { describe, expect, it } from "vitest";

import {
  MARKETING_FAQ_FIRST_VIEWPORT_ID,
  MARKETING_FAQ_MOST_ASKED_INTRO,
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_PAGE_TITLE,
  MARKETING_FAQ_PRIMARY_CONTENT_ID,
  MARKETING_FAQ_SKIP_TARGET_ID,
} from "@/lib/marketing/marketing-faq-page-copy";

describe("marketing-faq-page-copy", () => {
  it("uses product-safe FAQ page naming", () => {
    expect(MARKETING_FAQ_PAGE_TITLE).toBe("Product FAQ");
    expect(MARKETING_FAQ_PAGE_INTRO).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("keeps skip target aligned with the first-viewport band", () => {
    expect(MARKETING_FAQ_PRIMARY_CONTENT_ID).toBe("marketing-faq-primary-content");
    expect(MARKETING_FAQ_FIRST_VIEWPORT_ID).toBe("marketing-faq-first-viewport");
    expect(MARKETING_FAQ_SKIP_TARGET_ID).toBe(MARKETING_FAQ_FIRST_VIEWPORT_ID);
  });

  it("does not point buyers at a removed in-page search", () => {
    expect(MARKETING_FAQ_MOST_ASKED_INTRO.toLowerCase()).not.toContain("search");
  });
});
