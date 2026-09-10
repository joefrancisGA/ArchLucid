import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_HELP_BUYER_OVERVIEW,
  CORE_PILOT_HELP_PAGE_LEAD,
  CORE_PILOT_HELP_START_HERE_HELPER,
} from "@/lib/core-pilot-help-page-copy";

describe("core-pilot-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(CORE_PILOT_HELP_BUYER_OVERVIEW).not.toBe(CORE_PILOT_HELP_PAGE_LEAD);
    expect(CORE_PILOT_HELP_BUYER_OVERVIEW).not.toBe(CORE_PILOT_HELP_START_HERE_HELPER);
  });
});
