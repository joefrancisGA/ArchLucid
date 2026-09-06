import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  DIGESTS_SCHEDULE_TAB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
} from "@/lib/digests-route-paths";
import {
  DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES,
  DIGESTS_SUBSCRIPTIONS_SOURCES,
} from "@/lib/digests-subscriptions-evidence-copy";

describe("digests-subscriptions-evidence-copy (AIS)", () => {
  it("excludes in-tab and readiness CTAs from orientation Sources", () => {
    const orientationHrefs = DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(DIGESTS_SUBSCRIPTIONS_TAB_PATH);
    expect(orientationHrefs).not.toContain(ADVISORY_SCANS_SCHEDULES_HREF);
    expect(orientationHrefs).not.toContain(DIGESTS_SCHEDULE_TAB_PATH);
    expect(DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES.length).toBeLessThan(DIGESTS_SUBSCRIPTIONS_SOURCES.length);
    expect(DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
