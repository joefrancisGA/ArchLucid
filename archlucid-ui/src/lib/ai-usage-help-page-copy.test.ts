import { describe, expect, it } from "vitest";

import {
  AI_USAGE_HELP_BUYER_OVERVIEW,
  AI_USAGE_HELP_PAGE_LEAD,
  AI_USAGE_HELP_START_HERE_HELPER,
} from "@/lib/ai-usage-help-page-copy";

describe("ai-usage-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(AI_USAGE_HELP_BUYER_OVERVIEW).not.toBe(AI_USAGE_HELP_PAGE_LEAD);
    expect(AI_USAGE_HELP_BUYER_OVERVIEW).not.toBe(AI_USAGE_HELP_START_HERE_HELPER);
  });
});
