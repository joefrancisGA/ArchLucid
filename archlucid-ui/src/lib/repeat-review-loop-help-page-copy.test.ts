import { describe, expect, it } from "vitest";

import {
  REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW,
  REPEAT_REVIEW_LOOP_HELP_PAGE_LEAD,
  REPEAT_REVIEW_LOOP_HELP_START_HERE_HELPER,
} from "@/lib/repeat-review-loop-help-page-copy";

describe("repeat-review-loop-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW).not.toBe(REPEAT_REVIEW_LOOP_HELP_PAGE_LEAD);
    expect(REPEAT_REVIEW_LOOP_HELP_BUYER_OVERVIEW).not.toBe(REPEAT_REVIEW_LOOP_HELP_START_HERE_HELPER);
  });
});
