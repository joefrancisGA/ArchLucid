import { describe, expect, it } from "vitest";

import {
  ADVISORY_SCANS_SCHEDULES_BUYER_START_HERE_HELPER,
  ADVISORY_SCHEDULES_BUYER_OVERVIEW,
  ADVISORY_SCHEDULES_PAGE_LEAD,
} from "@/lib/advisory-copy";

describe("advisory-schedules buyer copy", () => {
  it("keeps buyer overview distinct from page lead and start-here helper", () => {
    expect(ADVISORY_SCHEDULES_BUYER_OVERVIEW).not.toBe(ADVISORY_SCHEDULES_PAGE_LEAD);
    expect(ADVISORY_SCHEDULES_BUYER_OVERVIEW).not.toBe(ADVISORY_SCANS_SCHEDULES_BUYER_START_HERE_HELPER);
  });
});
