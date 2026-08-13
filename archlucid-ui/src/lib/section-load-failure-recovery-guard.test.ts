import { describe, expect, it } from "vitest";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import { SECTION_LOAD_FAILURE_RECOVERY_SURFACES } from "@/lib/section-load-failure-recovery-inventory";

const UI_ROOT = process.cwd();

describe("section-load-failure-recovery-guard", () => {
  it("keeps a scoped retry on every guarded section failure", () => {
    const violations = findSurfaceMarkerViolations(UI_ROOT, SECTION_LOAD_FAILURE_RECOVERY_SURFACES);

    expect(violations.map((violation) => `${violation.surfaceId}: ${violation.message}`)).toEqual([]);
  });

  it("covers the high-traffic sections that previously rendered bare failure text", () => {
    const ids = SECTION_LOAD_FAILURE_RECOVERY_SURFACES.map((surface) => surface.id);

    expect(ids).toContain("signed-records-list");
    expect(ids).toContain("risk-exceptions");
    expect(ids).toContain("recurrence-schedules");
    expect(ids).toContain("tenant-cost-settings");
    expect(ids).toContain("cloud-connections-hub");
    expect(ids).toContain("executive-roi-trend");
    expect(ids).toContain("run-id-picker");
  });
});
