import { describe, expect, it } from "vitest";

import {
  PROCUREMENT_HELP_BUYER_OVERVIEW,
  PROCUREMENT_HELP_PAGE_LEAD,
  PROCUREMENT_HELP_START_HERE_HELPER,
} from "@/lib/procurement-help-page-copy";

describe("procurement-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(PROCUREMENT_HELP_BUYER_OVERVIEW).not.toBe(PROCUREMENT_HELP_PAGE_LEAD);
    expect(PROCUREMENT_HELP_BUYER_OVERVIEW).not.toBe(PROCUREMENT_HELP_START_HERE_HELPER);
  });
});
