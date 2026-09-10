import { describe, expect, it } from "vitest";

import {
  SYSTEM_HEALTH_HELP_BUYER_OVERVIEW,
  SYSTEM_HEALTH_HELP_PAGE_LEAD,
  SYSTEM_HEALTH_HELP_START_HERE_HELPER,
} from "@/lib/system-health-help-page-copy";

describe("system-health-help-page-copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(SYSTEM_HEALTH_HELP_BUYER_OVERVIEW).not.toBe(SYSTEM_HEALTH_HELP_PAGE_LEAD);
    expect(SYSTEM_HEALTH_HELP_BUYER_OVERVIEW).not.toBe(SYSTEM_HEALTH_HELP_START_HERE_HELPER);
  });
});
