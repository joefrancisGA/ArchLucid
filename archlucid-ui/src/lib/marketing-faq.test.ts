import { describe, expect, it } from "vitest";

import { MARKETING_FAQ_CATEGORIES, MARKETING_FAQ_ITEMS, filterMarketingFaqItems } from "./marketing-faq";

const BANNED_FAQ_TERMS = [
  "operator run view",
  "product cap",
  "pricing roadmap for diligence",
  "committed synthetic review run",
  "background",
  "standard product use",
  "fabricated architecture context",
] as const;

describe("marketing-faq", () => {
  it("lists buyer-ordered questions with category coverage", () => {
    expect(MARKETING_FAQ_ITEMS).toHaveLength(19);
    expect(MARKETING_FAQ_ITEMS[0]?.question).toBe("What is ArchLucid?");
    expect(MARKETING_FAQ_ITEMS[4]?.question).toBe("Can I start with one architect or one license?");
    expect(MARKETING_FAQ_ITEMS[6]?.question).toBe("Do I need cloud access to get value?");

    for (const category of MARKETING_FAQ_CATEGORIES) {
      expect(MARKETING_FAQ_ITEMS.some((item) => item.categoryId === category.id)).toBe(true);
    }
  });

  it("avoids outdated internal phrasing", () => {
    const corpus = MARKETING_FAQ_ITEMS.map((item) => `${item.question} ${item.answer}`).join(" ").toLowerCase();

    for (const term of BANNED_FAQ_TERMS) {
      expect(corpus, term).not.toContain(term);
    }
  });

  it("filters items by search query", () => {
    const hits = filterMarketingFaqItems(MARKETING_FAQ_ITEMS, "guided trial");

    expect(hits.map((item) => item.id)).toEqual(["request-help-guided-trial"]);
  });
});
