import { describe, expect, it } from "vitest";

import {
  IMPROVEMENT_PLANNING_EMPTY_TITLE,
  IMPROVEMENT_PLANNING_PAGE_SUBTITLE,
  IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER,
  IMPROVEMENT_PLANNING_PAGE_TITLE,
  IMPROVEMENT_PLANNING_PRODUCT_SAFE_INTRO,
  planningPageSubtitle,
} from "@/lib/planning-page-copy";

describe("planning-page-copy", () => {
  it("uses product-safe planning page naming", () => {
    expect(IMPROVEMENT_PLANNING_PAGE_TITLE).toBe("Improvement planning");
    expect(IMPROVEMENT_PLANNING_PRODUCT_SAFE_INTRO).not.toMatch(/read-only|GET \/|proxy override/i);
    expect(IMPROVEMENT_PLANNING_EMPTY_TITLE).toBe("No improvement plans yet");
  });

  it("uses a shorter buyer subtitle without duplicating header lead", () => {
    expect(planningPageSubtitle(true)).toBe(IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER);
    expect(planningPageSubtitle(false)).toBe(IMPROVEMENT_PLANNING_PAGE_SUBTITLE);
    expect(IMPROVEMENT_PLANNING_PAGE_SUBTITLE_BUYER.length).toBeLessThan(IMPROVEMENT_PLANNING_PAGE_SUBTITLE.length);
  });
});
