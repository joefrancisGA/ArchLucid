import { describe, expect, it } from "vitest";

import {
  COMPARE_BUYER_OVERVIEW,
  COMPARE_PAGE_LEAD,
  COMPARE_START_HERE_HELPER,
} from "@/lib/compare-two-reviews-page-copy";

describe("compare-two-reviews-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(COMPARE_BUYER_OVERVIEW).not.toBe(COMPARE_PAGE_LEAD);
    expect(COMPARE_BUYER_OVERVIEW).not.toBe(COMPARE_START_HERE_HELPER);
  });
});
