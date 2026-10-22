import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import {
  DIGESTS_SCHEDULE_ORIENTATION_SOURCES,
  DIGESTS_SCHEDULE_SOURCES,
} from "@/lib/digests-schedule-evidence-copy";

describe("digests-schedule-evidence-copy (ARS)", () => {
  it("excludes in-form and on-page schedule CTAs from orientation Sources", () => {
    const orientationHrefs = DIGESTS_SCHEDULE_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(DIGESTS_SUBSCRIPTIONS_TAB_PATH);
    expect(orientationHrefs).not.toContain(ADVISORY_SCANS_SCHEDULES_HREF);
    expect(DIGESTS_SCHEDULE_ORIENTATION_SOURCES.length).toBeLessThan(DIGESTS_SCHEDULE_SOURCES.length);
    expect(DIGESTS_SCHEDULE_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
