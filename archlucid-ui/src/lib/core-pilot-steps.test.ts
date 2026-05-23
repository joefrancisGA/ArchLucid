import { describe, expect, it } from "vitest";

import { CORE_PILOT_STEP_COUNT, CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";

describe("core-pilot-steps", () => {
  it("keeps CORE_PILOT_STEP_COUNT aligned with the checklist array", () => {
    expect(CORE_PILOT_STEPS).toHaveLength(CORE_PILOT_STEP_COUNT);
    expect(CORE_PILOT_STEP_COUNT).toBe(5);
  });

  it("keeps default-visible shortBody lines free of manifest jargon (detail may stay technical)", () => {
    for (const step of CORE_PILOT_STEPS) {
      expect(step.shortBody.toLowerCase()).not.toContain("manifest");
    }

    expect(CORE_PILOT_STEPS.filter((s) => (s.detail ?? "").toLowerCase().includes("manifest")).length).toBeGreaterThan(
      0,
    );
  });
});
