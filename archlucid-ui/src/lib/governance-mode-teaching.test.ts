import { describe, expect, it } from "vitest";

import {
  buildGovernanceModeTeaching,
  GOVERNANCE_MODE_TEACHING_HEADING,
  GOVERNANCE_MODE_TEACHING_STEPS,
} from "@/lib/governance-mode-teaching";

describe("governance-mode-teaching (TB-2392)", () => {
  it("references approval view mode vocabulary in coach steps", () => {
    const model = buildGovernanceModeTeaching();

    expect(model.heading).toBe(GOVERNANCE_MODE_TEACHING_HEADING);
    expect(model.steps).toHaveLength(GOVERNANCE_MODE_TEACHING_STEPS.length);
    expect(model.steps.map((step) => step.id)).toEqual(["labels", "routes", "revert"]);
    expect(model.steps[0]?.body).toContain("approval view");
  });
});
