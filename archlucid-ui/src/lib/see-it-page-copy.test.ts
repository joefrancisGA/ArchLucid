import { describe, expect, it } from "vitest";

import {
  SEE_IT_HERO_LEAD,
  SEE_IT_HERO_LEAD_BUYER,
  SEE_IT_HERO_LEAD_OPERATOR,
} from "@/lib/see-it-page-copy";

describe("see-it hero lead copy", () => {
  it("uses the shorter buyer lead on the marketing page", () => {
    expect(SEE_IT_HERO_LEAD).toBe(SEE_IT_HERO_LEAD_BUYER);
    expect(SEE_IT_HERO_LEAD_BUYER.length).toBeLessThan(SEE_IT_HERO_LEAD_OPERATOR.length);
  });
});
