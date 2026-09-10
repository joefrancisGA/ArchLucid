import { describe, expect, it } from "vitest";

import {
  REVIEW_GUIDE_HELP_BUYER_OVERVIEW,
  REVIEW_GUIDE_HELP_PAGE_LEAD,
  REVIEW_GUIDE_HELP_START_HERE_HELPER,
} from "@/lib/review-guide-help-page-copy";

describe("review-guide-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(REVIEW_GUIDE_HELP_BUYER_OVERVIEW).not.toBe(REVIEW_GUIDE_HELP_PAGE_LEAD);
    expect(REVIEW_GUIDE_HELP_BUYER_OVERVIEW).not.toBe(REVIEW_GUIDE_HELP_START_HERE_HELPER);
  });
});
