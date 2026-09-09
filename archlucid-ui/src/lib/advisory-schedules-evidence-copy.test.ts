import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  ADVISORY_SCHEDULES_ORIENTATION_SOURCES,
  ADVISORY_SCHEDULES_SOURCES,
} from "@/lib/advisory-schedules-evidence-copy";

describe("advisory-schedules-evidence-copy (AD)", () => {
  it("keeps orientation Sources free of schedules-tab self-href", () => {
    const orientationHrefs = ADVISORY_SCHEDULES_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(ADVISORY_SCANS_SCHEDULES_HREF);
    expect(ADVISORY_SCHEDULES_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
