import { describe, expect, it } from "vitest";

import { CORE_PILOT_STEP_COUNT, CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";

describe("core-pilot-steps", () => {
  it("keeps CORE_PILOT_STEP_COUNT aligned with the checklist array", () => {
    expect(CORE_PILOT_STEPS).toHaveLength(CORE_PILOT_STEP_COUNT);
    expect(CORE_PILOT_STEP_COUNT).toBe(4);
  });
});
