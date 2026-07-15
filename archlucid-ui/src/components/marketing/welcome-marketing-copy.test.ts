import { describe, expect, it } from "vitest";

import { WELCOME_USE_CASE_CARDS } from "@/components/marketing/welcome-marketing-copy";

describe("welcome-marketing-copy", () => {
  it("TB-769: use-case cards present AWS and Google Cloud framework peers", () => {
    const titles = WELCOME_USE_CASE_CARDS.map((card) => card.title);

    expect(titles).toContain("AWS Well-Architected Framework");
    expect(titles).toContain("Google Cloud Architecture Framework");
    expect(titles.filter((title) => title.startsWith("Azure"))).toHaveLength(0);
  });
});
