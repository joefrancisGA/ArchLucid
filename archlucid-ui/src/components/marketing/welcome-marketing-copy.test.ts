import { describe, expect, it } from "vitest";

import { WELCOME_USE_CASE_CARDS, WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE } from "@/components/marketing/welcome-marketing-copy";

describe("welcome-marketing-copy", () => {
  it("TB-769: use-case cards present AWS and Google Cloud framework peers", () => {
    const titles = WELCOME_USE_CASE_CARDS.map((card) => card.title);

    expect(titles).toContain("AWS Well-Architected Framework");
    expect(titles).toContain("Google Cloud Architecture Framework");
    expect(titles.filter((title) => title.startsWith("Azure"))).toHaveLength(0);
  });

  it("TB-779: discloses Azure-default policy pack baseline on new workspaces", () => {
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toMatch(/cloud-neutral security and FinOps packs/i);
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toMatch(/Azure Well-Architected and CIS Azure packs/i);
    expect(WELCOME_DEFAULT_POLICY_PACK_BASELINE_NOTE).toMatch(/target AWS or Google Cloud in a review/i);
  });
});
