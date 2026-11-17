import { describe, expect, it } from "vitest";

import { formatWizardPresetStringListHonesty } from "@/lib/wizard-presets";

describe("wizard preset list honesty", () => {
  it("distinguishes null and empty preset string lists", () => {
    expect(formatWizardPresetStringListHonesty(null, "Constraints")).toContain("were not stored");
    expect(formatWizardPresetStringListHonesty([], "Required capabilities")).toContain("stored as an empty list");
    expect(formatWizardPresetStringListHonesty(["HTTPS ingress"], "Required capabilities")).toBeNull();
  });
});
