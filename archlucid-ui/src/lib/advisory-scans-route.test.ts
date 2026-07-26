import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_HREF, ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";

describe("advisory-scans-route", () => {
  it("exposes the Governance-canonical Advisory scans paths (TB-1124)", () => {
    expect(ADVISORY_SCANS_HREF).toBe("/governance/advisory-scans");
    expect(ADVISORY_SCANS_SCHEDULES_HREF).toBe("/governance/advisory-scans?tab=schedules");
  });
});
