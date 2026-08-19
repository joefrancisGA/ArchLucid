import { describe, expect, it } from "vitest";

import {
  MARKETING_FAQ_MOST_ASKED_INTRO,
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_PAGE_TITLE,
} from "@/lib/marketing/marketing-faq-page-copy";

describe("marketing-faq-page-copy", () => {
  it("uses product-safe FAQ page naming", () => {
    expect(MARKETING_FAQ_PAGE_TITLE).toBe("Product FAQ");
    expect(MARKETING_FAQ_PAGE_INTRO).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("does not point buyers at a removed in-page search", () => {
    expect(MARKETING_FAQ_MOST_ASKED_INTRO.toLowerCase()).not.toContain("search");
  });
});
