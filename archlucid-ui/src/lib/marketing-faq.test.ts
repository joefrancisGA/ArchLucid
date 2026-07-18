import { afterEach, describe, expect, it } from "vitest";

import { findCustomerAuthBannedPhrases } from "@/lib/auth/customer-auth-messaging";

import {
  buildHowDoISignInFaqAnswer,
  filterMarketingFaqItems,
  getMarketingFaqItems,
  MARKETING_FAQ_CATEGORIES,
} from "./marketing-faq";

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
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY;
    delete process.env.NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID;
  });

  it("lists buyer-ordered questions with category coverage", () => {
    const items = getMarketingFaqItems();

    expect(items).toHaveLength(21);
    expect(items[0]?.question).toBe("What is ArchLucid?");
    expect(items[4]?.question).toBe("Can I start with one architect or one license?");
    expect(items[6]?.question).toBe("How do I sign in to ArchLucid?");
    expect(items[8]?.question).toBe("Do I need cloud access to get value?");

    for (const category of MARKETING_FAQ_CATEGORIES) {
      expect(items.some((item) => item.categoryId === category.id)).toBe(true);
    }
  });

  it("omits Google from sign-in FAQ when Google OIDC env is unset", () => {
    const answer = buildHowDoISignInFaqAnswer().toLowerCase();

    expect(answer).toContain("microsoft");
    expect(answer).not.toContain("google");
  });

  it("includes Google in sign-in FAQ when Google OIDC env is set", () => {
    process.env.NEXT_PUBLIC_GOOGLE_OIDC_AUTHORITY = "https://accounts.google.com";
    process.env.NEXT_PUBLIC_GOOGLE_OIDC_CLIENT_ID = "client.apps.googleusercontent.com";

    expect(buildHowDoISignInFaqAnswer().toLowerCase()).toContain("google");
  });

  it("avoids outdated internal phrasing", () => {
    const corpus = getMarketingFaqItems()
      .map((item) => `${item.question} ${item.answer}`)
      .join(" ")
      .toLowerCase();

    for (const term of BANNED_FAQ_TERMS) {
      expect(corpus, term).not.toContain(term);
    }

    expect(findCustomerAuthBannedPhrases(corpus)).toEqual([]);
  });

  it("links procurement diligence to the in-app procurement FAQ without duplicating SOC 2 detail", () => {
    const item = getMarketingFaqItems().find((entry) => entry.id === "security-assurance-materials");

    expect(item?.answer).toContain("/help/procurement");
    expect(item?.answer.toLowerCase()).not.toContain("type ii cpa attestation");
  });

  it("filters items by search query", () => {
    const hits = filterMarketingFaqItems(getMarketingFaqItems(), "guided trial");

    expect(hits.map((item) => item.id)).toEqual(["request-help-guided-trial"]);
  });
});
