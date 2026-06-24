import { describe, expect, it } from "vitest";

import { CORE_PILOT_STEP_COUNT, CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";

describe("core-pilot-steps", () => {
  it("keeps CORE_PILOT_STEP_COUNT aligned with the checklist array", () => {
    expect(CORE_PILOT_STEPS).toHaveLength(CORE_PILOT_STEP_COUNT);
    expect(CORE_PILOT_STEP_COUNT).toBe(5);
  });

  it("starts with evidence-first language instead of an Azure prerequisite", () => {
    const firstStep = CORE_PILOT_STEPS[0];

    expect(firstStep.title).toBe("Provide architecture evidence");
    expect(firstStep.primaryLabel).toBe("Start a review");
    expect(firstStep.primaryHref).toBe("/reviews/new");
    expect(firstStep.shortBody.toLowerCase()).toContain("brief");
    expect(firstStep.shortBody.toLowerCase()).toContain("azure");
    expect(firstStep.title.toLowerCase()).not.toContain("azure");
  });

  it("keeps default-visible shortBody lines free of manifest jargon (detail may stay technical)", () => {
    for (const step of CORE_PILOT_STEPS) {
      expect(step.shortBody.toLowerCase()).not.toContain("manifest");
    }

    expect(
      CORE_PILOT_STEPS.filter((s) => (s.detail ?? "").toLowerCase().includes("signed review")).length,
    ).toBeGreaterThan(0);
  });
});
