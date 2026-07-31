import { describe, expect, it } from "vitest";

import {
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_PAGE_TITLE,
  MARKETING_FAQ_SEARCH_PLACEHOLDER,
} from "@/lib/marketing/marketing-faq-page-copy";

describe("marketing-faq-page-copy", () => {
  it("uses product-safe FAQ page naming", () => {
    expect(MARKETING_FAQ_PAGE_TITLE).toBe("Product FAQ");
    expect(MARKETING_FAQ_PAGE_INTRO).not.toMatch(/GET \/|proxy override|read-only API/i);
    expect(MARKETING_FAQ_SEARCH_PLACEHOLDER.toLowerCase()).toContain("evaluation");
  });
});
